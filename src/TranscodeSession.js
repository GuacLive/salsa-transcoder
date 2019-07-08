import ffmpeg from 'fluent-ffmpeg';
const presets = {
	'low': {
		'ac': 'libfdk_aac',
		'vc': 'libx264',
		'ab': '32k',
		'vb': '128k',
		'preset': 'ultrafast'
	},
	'medium': {
		'ac': 'libfdk_aac',
		'vc': 'libx264',
		'ab': '64k',
		'vb': '256k',
		'preset': 'ultrafast'
	},
	'high': {
		'ac': 'libfdk_aac',
		'vc': 'libx264',
		'ab': '128k',
		'vb': '512k',
		'preset': 'ultrafast'
	},
	'src': {
		'copy': true
	}
};
export default class TranscodeSession {
	constructor(rtmpInput, rtmpOutput, streamName, preset){
		this.rtmpInput = rtmpInput;
		this.rtmpOutput = rtmpOutput;
		this.streamName = streamName || (new Date).getTime();
		this.preset = preset || 'src';
		this.proc = null;
	}

	getId() {
		return this.streamName + '_' + this.preset;
	}

	stop(){
		this.proc.ffmpegProc.stdin.write('q');
		this.proc.ffmpegProc.kill();
	}

	transcode(){
		if(presets && typeof presets[this.preset] !== 'object'){
			console.log('invalid preset', this.preset, presets);
			return new Error('invalid preset');
		}
		let rtmpOutput = `${this.rtmpOutput}/${this.streamName}_${this.preset}`;
		let preset = presets[this.preset];
		this.proc = ffmpeg(`${this.rtmpInput}/${this.streamName}`)
		.format('flv');
		if(!preset.copy){
			this.proc = this.proc
				.outputOptions([
					`-preset ${
					preset.preset && preset.preset.match(/^[a-z]+$/i)
						? preset.preset : 'ultrafast'
					}
				`,
					'-tune zerolatency'
				]);
			if(preset.ac){
				this.proc = this.proc.audioCodec(preset.ac);
			}
			if(preset.vc){
				this.proc = this.proc.videoCodec(preset.vc);
			}
			if(preset.ab){
				this.proc = this.proc.audioBitrate(preset.ab);
			}
			if(preset.vb){
				this.proc = this.proc.videoBitrate(preset.vb);
			}
		}
		this.proc
			// setup event handlers
			.on('error', function (err, stdout, stderr) {
				console.log('Cannot process video: ' + err.message, stdout, stderr);
			})
			.on('stderr', function(stderrLine) {
				console.log('Stderr output: ' + stderrLine);
			})
			.on('end', () => {
				console.log('file has been converted succsesfully');
			})
			.on('error', (err) => {
				console.log('an error happened: ' + err.message);
			})
			// save to stream
			.save(rtmpOutput); //	  
	}
}
