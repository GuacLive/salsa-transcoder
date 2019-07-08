import { parse } from 'url';
import micro, { json, send } from 'micro';

import TranscodeSession from './src/TranscodeSession';
import ScreenshotSession from './src/ScreenshotSession';

import Redis from 'ioredis';

let sessions = [];

var redis = new Redis();
var pub = new Redis();

redis.subscribe('videoQueue', 'screenshotQueue', (err, count) =>{
	console.log(err, count);
});

redis.on('message', (channel, data) => {
	console.log('Receive data %s from channel %s', JSON.parse(data), channel);
	data = JSON.parse(data);
	if(channel == 'videoQueue'){
		if(data){
			const rtmpInput = data.rtmpInput;
			const rtmpOutput = data.rtmpOutput;
			const streamName = data.streamName;
			const preset = data.preset;
			let session = new TranscodeSession(rtmpInput, rtmpOutput, streamName, preset);
			session.transcode();
			sessions[session.getId()] = session;
		}
	}else if(channel == 'screenshotQueue'){
		if(data){
			const rtmpInput = data.rtmpInput;
			const streamName = data.streamName;
			let session = new ScreenshotSession(rtmpInput, streamName);
			session.screenshot();
		}
	}
});

const server = micro(async(req, res) => {
	const {query, pathname} = await parse(req.url, true);
	let data = ['POST', 'PUT'].includes(req.method) ? await json(req) : query;
	let result = {};
	console.log(query, pathname);
	if(['POST', 'PUT'].includes(req.method)){
		switch(pathname){
			case '/screenshot':
				if(data.rtmpInput && data.streamName){
					pub.publish('screenshotQueue', JSON.stringify({
						rtmpInput: data.rtmpInput,
						streamName: data.streamName,
					}));
				}
			break;
			case '/startTranscode':
				var presets = typeof data.presets === 'array' ? data.presets : ['src'];
				presets.forEach((preset) => {
					if(data.rtmpInput && data.rtmpOutput && data.streamName){
						console.log('startTranscode', data, preset);
						pub.publish('videoQueue', JSON.stringify({
							rtmpInput: data.rtmpInput,
							rtmpOutput: data.rtmpOutput,
							streamName: data.streamName,
							preset
						}));
					}
				});
			break;
			case '/stopTranscode':
					var presets = typeof data.presets == 'array' ? data.presets : ['src'];
					presets.forEach(async (preset) => {
						if(data.streamName){
							let sessionId = data.streamName + '_' + preset;
							console.log('aaaa', sessionId);
							if(sessionId && sessions[sessionId]){
								sessions[sessionId].stop();
								delete sessions[sessionId];
							}
						}
					});	
			break;
			default:
				result = {
					'statusCode': 400
				};
			break;
		}
	}else{
		switch(pathname){
			case '/':
				result = {
					'healthy': true
				};
			break;
			default:
				result = {
				'statusCode': 404
				};
			break;
		}
	}
	
	if(!result.statusCode) result.statusCode = 200;
	let status = result.statusCode;
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
	send(res, status, result);
});
server.listen(8888)