import ffmpeg from 'fluent-ffmpeg';
export default class ScreenshotSession {
	constructor(rtmpInput, streamName) {
		this.rtmpInput = rtmpInput;
		this.streamName = streamName || (new Date).getTime();
		this.preset = 'thumb';
	}

	screenshot(){
		let file = `./media/${this.streamName}_${this.preset}.png`;
		let proc = ffmpeg(this.rtmpInput)
			.on('end', () => {
				console.log('file has been converted succsesfully');
			})
			.on('error', (err) => {
				console.log('an error happened: ' + err.message);
			})
			.outputOptions(['-f image2', '-vframes 1', '-vcodec png', '-f rawvideo', '-s 320x240', '-ss 00:00:01'])
			.output(file)
			.run();
	}
}