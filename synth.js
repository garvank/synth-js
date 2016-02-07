/* 
 *  Declare namespace
 */

var Synth = function(){
  this.context = new AudioContext();
};



/* 
 *  Some presets 
 */

  Synth.presets = { 
    kick: {
      type: 'sine',
      frequency: 100,
      duration: .3,
      vol: 1,
      ramp: {
        to: 70
      },
      env: {
        decay: 20
      }
    },
    snare: {
      type: 'square',
      frequency: 100,
      duration: .05,
      vol: 1,
      env: {
        attack: 10,
        decay: 20
      }
    },
    beeper: {
      type: 'triangle',
      frequency: 440,
      duration: .2,
      vol: 1,
      filter: {
        frequency: 1000,
        type: 'highpass',
        gain: 25
      },
      env: {
        decay: 15
      }
    }
  };



/* 
 *  Accepts a "sound" object and plays it
 */

  Synth.prototype.play = function(sound){
  
    var self  = this,
        osc   = self.context.createOscillator(),
        decay = 0,
        connection;
        
        // Supported: ['sine', 'triangle', 'sawtooth', 'square']
        osc.type = sound.type;
        osc.frequency.setValueAtTime(sound.frequency, self.context.currentTime);
        connection = osc;
  
        // Manipulate frequency over time
        if(sound.ramp){
  
          var bendAt = sound.ramp.at || sound.duration;
  
          connection.frequency.linearRampToValueAtTime(
            sound.ramp.to, 
            self.context.currentTime + bendAt
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
  
  
        if(sound.env){
          var gainNode   = self.context.createGain(),
              attackPeak = self.context.currentTime + ((sound.env.attack/100) * sound.duration);
  
          if(sound.env.attack){
            gainNode.gain.value = 0;
            gainNode.gain.setValueAtTime(0.0, self.context.currentTime);
            gainNode.gain.linearRampToValueAtTime(sound.vol, attackPeak);
          }
  
          if(sound.env.decay){
            decay = (sound.env.decay/100) * sound.duration + 0.2;
            gainNode.gain.setTargetAtTime(0.0, self.context.currentTime + sound.duration, 0.5);
          }
  
  
  
          connection.connect(gainNode);
          connection = gainNode;
        }
        
  
        connection.connect(self.context.destination);
        osc.start(self.context.currentTime);
        osc.stop(self.context.currentTime + sound.duration + decay);
  
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
    var calculated_bpm = self.calculateBpm(bpm);
    
    
    // Play each sound, then wait for the offset 
    for(i=0; i < queue.length; i++){
  
      (function(offset){
        
        setTimeout(function(){
          self.play(queue[offset]);
  
        }, offset * calculated_bpm)
  
      })(i);
    }
  };





