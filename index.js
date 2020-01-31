const fs = require('fs');
const readline = require('readline');
const axios = require('axios').default;
const natural = require('natural');
const WordPOS = require('wordpos');

// wordPOS configuration
WordPOS.defaults = {
  stopwords: true,
};
const wordpos = new WordPOS();

natural.PorterStemmer.attach();
// configure input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const apiKey = fs.readFileSync('api_key');
const baseURL = 'https://api.musixmatch.com/ws/1.1/';

async function find() {
  // 1. get artist and song from user input
  rl.question('Artist name: ', (artist) => {
    rl.question('Song name: ', (song) => {
      rl.close();

      // 2. search for lyrics
      const getTrackURL = `${baseURL}matcher.lyrics.get?q_track=${song}&q_artist=${artist}&apikey=${apiKey}`;
      axios.get(getTrackURL).then(async (response) => {
        // 3. process lyrics to find the mostly used word (stem)
        let rawLyrics = response.data.message.body.lyrics.lyrics_body;

        const index = rawLyrics.indexOf('*******');
        rawLyrics = rawLyrics.substr(0, index);

        // console.log(`raw: ${rawLyrics}`);
        const tokenizer = new natural.WordTokenizer();
        const tokenizedArray = tokenizer.tokenize(rawLyrics.toLowerCase());
        // console.log();

        // console.log(`tokenizedArray: ${tokenizedArray}`);
        // console.log();

        const wordsCounter = {};

        // TODO: log
        for (let i = 0; i < tokenizedArray.length; i += 1) {
          const token = tokenizedArray[i].toLowerCase();
          const stem = natural.PorterStemmer.stem(token);
          try {
            const pos = await wordpos.getPOS(token);
            if (pos.rest.length === 0) {
              if (wordsCounter[stem]) {
                wordsCounter[stem].count += 1;
              } else {
                wordsCounter[stem] = {
                  label: token,
                  count: 1,
                };
              }
            }
          } catch (e) {
            // no need to do anything
          }
        }

        let max = 0;
        let trackName = '';

        for (const word in wordsCounter) {
          if (wordsCounter[word].count > max) {
            trackName = wordsCounter[word].label;
            max = wordsCounter[word].count;
          }
        }

        // console.log(`wordsCounter data: ${JSON.stringify(wordsCounter)}`);
        console.log();

        console.log(`most common word(stem) in song: ${trackName}`);

        // 4. Search for song titles that contain the mostly used word
        const matchingTracksURL = `${baseURL}track.search?q_track=${trackName}&page_size=5&page=1&s_track_rating=desc&apikey=${apiKey}`;
        const matchingTracksResponse = await axios.get(matchingTracksURL);
        const matchingTracks = matchingTracksResponse.data.message.body.track_list
          .map((element) => `${element.track.artist_name} - ${element.track.track_name}`);
        console.log('Matching Tracks:');
        matchingTracks.forEach((t) => console.log(t));
      });
    });
  });
}


find();
