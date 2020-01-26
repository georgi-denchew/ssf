const fs = require('fs');
const readline = require('readline');
const axios = require('axios').default;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const apiKey = fs.readFileSync('api_key');
const baseURL = 'https://api.musixmatch.com/ws/1.1/';

rl.question('Artist name: ', (artist) => {
  rl.question('Song name: ', (song) => {
    rl.close();

    // start
    const requestURL = `${baseURL}matcher.lyrics.get?q_track=${song}&q_artist=${artist}&apikey=${apiKey}`;
    axios.get(requestURL).then((response) => {
      const rawLyrics = response.data.message.body.lyrics.lyrics_body;
      console.log(`lyrics: ${rawLyrics}`);
    });
  });
});

// process.stdout.write("Hello! This is the Similar Song Finder Application. Your request will be processed ");
// const myArgs = process.argv.slice(2);
// const artist = myArgs[0];
// const song = myArgs[1];
// console.log(`my args ${myArgs}`);
// console.log(apiKey);
