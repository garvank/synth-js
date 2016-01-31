


/* 
 *  Some presets 
 */

var kick = {
  type: 'sawtooth',
  frequency: 100,
  duration: .3,
  ramp: {
    to: 50
  }
};

var beep1 = {
  type: 'triangle',
  frequency: 440,
  duration: .2,
  filter: {
    frequency: 1000,
    type: 'highpass',
    gain: 25
  }
};

var beep2 = {
  type: 'triangle',
  frequency: 587.33,
  duration: .2,
  filter: {
    frequency: 1000,
    type: 'highpass',
    gain: 25
  }
};

var beep3 = {
  type: 'triangle',
  frequency: 739.99,
  duration: .2,
  filter: {
    frequency: 1000,
    type: 'highpass',
    gain: 25
  }
};




/* 
 *  Declare namespace
 */

var Synth = {};



/* 
 *  Build master audio context
 */

Synth.context = new AudioContext();



/* 
 *  Accepts a "sound" object and plays it
 */

Synth.play = function(sound){

  var osc = Synth.context.createOscillator(),
      connection;
      
      // Supported: ['sine', 'triangle', 'sawtooth', 'square']
      osc.type = sound.type;
      osc.frequency.setValueAtTime(sound.frequency, Synth.context.currentTime);
      connection = osc;

      // Manipulate frequency over time
      if(sound.ramp){
        osc.frequency.linearRampToValueAtTime(
          sound.ramp.to, 
          Synth.context.currentTime + sound.duration
        );  
      }

      // Apply filter if requested
      if(sound.filter){
        var filter = Synth.context.createBiquadFilter();

        filter.type = sound.filter.type;
        filter.frequency.value = sound.filter.frequency;
        filter.gain.value = sound.filter.gain;

        connection.connect(filter);
        connection = filter;

      }
      

      connection.connect(Synth.context.destination);
      osc.start(Synth.context.currentTime);
      osc.stop(Synth.context.currentTime + sound.duration);
};



/* 
 *  Calculates BPM
 */
 
Synth.calculateBpm = function(bpm){
  
  var second = 1000,
      minute = second * 60
      bpms   = minute/bpm;

  return bpms;
}



/* 
 *  Accepts an array of sounds to sequence and a bpm
 */

Synth.sequence = function(queue, bpm, loops){
  
  // Get BPM delay in milliseconds
  var calculated_bpm = Synth.calculateBpm(bpm);
  
  // Play each sound, then wait for the offset 
  for(i=0; i < queue.length; i++){

    (function(offset){
      
      setTimeout(function(){
        Synth.play(queue[offset]);

      }, offset * calculated_bpm)

    })(i);
  }
};





