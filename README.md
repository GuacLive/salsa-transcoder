# How to use
### Start transcoding
To start transcoding, we need to know rtmpInput (current RTMP feed), rtmpOutput (where to output the transcoded stream), streamName and the wanted presets (array)
``bash
curl -i -H 'Content-type: application/json' -XPOST http://localhost:8888/startTranscode -d '{"rtmpInput":"rtmp://stream.local.guac.live/live","rtmpOutput":"rtmp://stream.local.guac.live/hls-live","streamName":"guac","presets":["high","medium","low","src"]}'
``
### Stop transcoding
To stop transcoding, we need to know the streamName and the presets we want to stop transcoding.
``bash
curl -i -H 'Content-type: application/json' -XPOST http://localhost:8888/stopTranscode -d '{"streamName":"guac","presets":["high","medium","low","src"]}'
``