(function (root) {


  /*
   * Initialize
   */

   function Synth() {
     this.context = new AudioContext();
     this.modulators = [];
   }



  /*
   * Some presets - static properties on Synth
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
        duration: .05
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
   * Add modulator to current synth
   */

    Synth.prototype.addModulator = function (modulator) {
      var carrier;
      var mod = new Modulator(this.context, modulator.type, modulator.freq, modulator.gain);
  
      if (this.carrier) {
        carrier = this.modulators.length ? this.modulators[this.modulators.length - 1].osc : this.carrier;
        mod.gainNode.connect(carrier.frequency);
      }
      this.modulators.push(mod);
      return mod;
    };



  /*
   * Set global synth gain
   */

    Synth.prototype.gain = function (gain) {
      this.gainNode.gain.value = gain;
    };
  


  /*
   *  Accepts a "sound" object and plays it
   */

    Synth.prototype.play = function(sound){
  
      var filter,
          destination;
  
      // Supported: ['sine', 'triangle', 'sawtooth', 'square']
      this.carrier = setupCarrier(sound);
  
      destination = this.context.createGain();
      destination.gain.value = 0.5;
      destination.connect(this.context.destination);

      this.gainNode = this.context.createGain();
      this.gainNode.gain.value = 1;
      this.gainNode.connect(destination);

      this.carrier.connect(this.gainNode);
  
      // Bend frequency over time
      if(sound.ramp){
        this.carrier.frequency.linearRampToValueAtTime(
          sound.ramp.to,
          this.context.currentTime + sound.duration
        );
      }
  
      // Apply filter if requested
      if(sound.filter){
        filter = this.context.createBiquadFilter();
        filter.type = sound.filter.type;
        filter.frequency.value = sound.filter.frequency;
        filter.gain.value = sound.filter.gain;
        filter.connect(this.carrier.frequency);
      }
  
      var connectModulators = (function () {
        var carrier = this.carrier;
        this.modulators.length && this.modulators.forEach(function (mod) {
          mod.gainNode.connect(carrier.frequency);
          carrier = mod.osc;
        });
      }).bind(this);
  
      connectModulators();
  
      this.carrier.start(this.context.currentTime);
  
      if (sound.duration) {
        this.carrier.stop( this.context.currentTime + sound.duration);
      }
    };
  


  /*
   * Stop all sound from current synth
   */

    Synth.prototype.stop = function(sound) {
      if(sound.env.decay){
        var decay = (sound.env.decay/100) * sound.duration + 0.2;
        this.gain.setTargetAtTime(0.0, self.context.currentTime + sound.duration, 0.5);
      }else {
        this.gain(0);  
      }

      this.modulators.length = 0;
    }



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
  


  /*
   *  Accepts an array of sounds to sequence and a bpm
   */

    Synth.prototype.sequence = function(queue, bpm, loops){
  
      // Get BPM delay in milliseconds
      var calculated_bpm = this.calculateBpm(bpm);
  
      // Play each sound, then wait for the offset
      for(i=0; i < queue.length; i++){
        ((function(offset){
          setTimeout((function(){
            this.play(queue[offset]);
          }).bind(this), offset * calculated_bpm)
        }).bind(this))(i);
      }
    };





  /* --------------- *
   * Private Methods *
   * --------------- */

    // A modulator have a this.carrierillator and a gain
    function Modulator (context, type, freq, gain) {
      this.osc = context.createOscillator();
      this.gainNode = context.createGain();
      this.osc.type = type;
      this.osc.frequency.value = freq;
      this.gainNode.gain.value = gain;
      this.osc.connect(this.gainNode);
      this.osc.start(0);
    }

    // Set up carrier oscillator node
    function setupCarrier(sound) {
      var carrier = this.context.createOscillator();
      
      carrier.type = sound.type;
      carrier.frequency.setValueAtTime(sound.frequency, this.context.currentTime);

      return carrier;
    }



  root.Synth = Synth;

})(window);
