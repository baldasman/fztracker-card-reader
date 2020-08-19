'use strict';

// #############
// Example: Controlling LED and buzzer on ACR122U
// - what is covered:
//   - custom led blinks
//   - custom buzzer output
//   - repeated beeping on unsuccessful read/write operation
// - TODO:
//   - document how to allow escape commands (direct communication without card)
//   - meanwhile please see https://github.com/pokusew/nfc-pcsc/issues/13
// #############

import {NFC, CONNECT_MODE_DIRECT} from '../src/index';

const request = require('request')

// CONFIG
var fs = require('fs');
var configObj = {};

if (!fs.existsSync('config.json')) {
	//file exists
	throw 'Missing config.json!';
}

try {	
	const configText = fs.readFileSync('config.json', 'utf8');
	configObj = JSON.parse(configText);	
} catch (error) {

	throw 'config.json is invalid!!!';
}

// Setup HFC reader
const nfc = new NFC();  // const nfc = new NFC(pretty); // optionally you can
                        // pass logger to see internal debug logs

console.log(`LOCATION=[${configObj.location}] API=${configObj.serverApi}`);

nfc.on('reader', reader => {
  console.log(reader.name + ' reader attached, waiting for cards ...');

  reader.on('card', card => {
    console.log(`[${reader.name}] card=${card.uid}`);

    // Call log API
    request.post(
        `http://${configObj.serverApi}/fztracker/v1/entities/movement`, {
          headers: {'Authorization': `Bearer ${configObj.token}`},
          json: {
            'location': configObj.location,
            'sensor': reader.name,
            'cardId': card.uid,
            'manual': false,
          },

        },
        (error, res, body) => {
          if (error) {
            console.error('Unkown card', body, error);
            return;
          }

          console.log(`[OK] statusCode: ${res.statusCode}`);
          console.log(body);
        });
  });

  reader.on('error', err => {
    console.error('reader error', err);
  });

  reader.on('end', () => {
    console.log(reader.name + ' reader disconnected.');
  });
});
