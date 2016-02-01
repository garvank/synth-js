


/* 
 *  Some presets 
 */

var kick = {
  type: 'sine',
  frequency: 100,
  duration: .3,
  ramp: {
    to: 70
  }
};

var snare = {
  type: 'square',
  frequency: 100,
  duration: .05,
};

var beep_a = {
  type: 'triangle',
  frequency: 440,
  duration: .2,
  filter: {
    frequency: 1000,
    type: 'highpass',
    gain: 25
  }
};

var beep_d = {
  type: 'triangle',
  frequency: 587.33,
  duration: .2,
  filter: {
    frequency: 1000,
    type: 'highpass',
    gain: 25
  }
};

var beep_fsharp = {
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

var Synth = function(){
  this.context = new AudioContext();
};



/* 
 *  Accepts a "sound" object and plays it
 */

Synth.prototype.play = function(sound){

  var self = this,
      osc = self.context.createOscillator(),
      connection;
      
      // Supported: ['sine', 'triangle', 'sawtooth', 'square']
      osc.type = sound.type;
      osc.frequency.setValueAtTime(sound.frequency, self.context.currentTime);
      connection = osc;

      // Manipulate frequency over time
      if(sound.ramp){
        osc.frequency.linearRampToValueAtTime(
          sound.ramp.to, 
          self.context.currentTime + sound.duration
        );  
      }

      // Apply filter if requested
      if(sound.filter){
        var filter = self.context.createBiquadFilter();

        filter.type = sound.filter.type;
        filter.frequency.value = sound.filter.frequency;
        filter.gain.value = sound.filter.gain;

        connection.connect(filter);
        connection = filter;

      }
      

      connection.connect(this.context.destination);
      osc.start(this.context.currentTime);
      osc.stop( this.context.currentTime + sound.duration);
};



/* 
 *  Calculates BPM
 */
 
Synth.prototype.calculateBpm = function(bpm){
  
  var second = 1000,
      minute = second * 60
      bpms   = minute/bpm;

  return bpms;
}



/* 
 *  Accepts an array of sounds to sequence and a bpm
 */

Synth.prototype.sequence = function(queue, bpm, loops){
  
  var self = this;

  // Get BPM delay in milliseconds
  var calculated_bpm = this.calculateBpm(bpm);
  
  
  // Play each sound, then wait for the offset 
  for(i=0; i < queue.length; i++){

    (function(offset){
      
      setTimeout(function(){
        self.play(queue[offset]);

      }, offset * calculated_bpm)

    })(i);
  }
};





