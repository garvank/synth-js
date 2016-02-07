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
        duration: .05,
        env: {
          attack: 5,
          decay: 30
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
      if(this.gainNode){
        this.gainNode.gain.value = gain;  
      }else{
        console.warn('No gainNode initialized');
      }
      
    };
  


  /*
   *  Accepts a "sound" object and plays it
   */

    Synth.prototype.play = function(sound){
  
      var filter,
          destination;
  
      // Supported: ['sine', 'triangle', 'sawtooth', 'square']
      this.carrier = setupCarrier(sound, this.context);
  
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
      
      this.start(sound);
  
      if (sound.duration) {
        this.stop(sound);
      }
    };



  /*
   * Start sound
   */

    Synth.prototype.start = function(sound) {
      
      if(sound && sound.env && sound.env.attack){
        var attackPeak = this.context.currentTime + ((sound.env.attack/100) * sound.duration),
            volume = sound.vol || 1;
        
        this.gain(0);
        this.gainNode.gain.setValueAtTime(0.0, this.context.currentTime);
        this.gainNode.gain.linearRampToValueAtTime(volume, attackPeak);
      }

      connectModulators(this);
      this.carrier.start(this.context.currentTime);
    }



  /*
   * Stop all sound from current synth
   */

    Synth.prototype.stop = function(sound) {
      if(sound && sound.env && sound.env.decay){
        var decay = (sound.env.decay/100) * sound.duration + 0.2;
        this.gainNode.gain.setTargetAtTime(0.0, this.context.currentTime + sound.duration + decay, 0.5);
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


    // Connects all Modulators
    function connectModulators(synth) {
        var carrier = synth.carrier;

        synth.modulators.length && synth.modulators.forEach(function (mod) {
          mod.gainNode.connect(carrier.frequency);
          carrier = mod.osc;
        });
    }


    // Set up carrier oscillator node
    function setupCarrier(sound, context) {
      var carrier = context.createOscillator();
      
      carrier.type = sound.type;
      carrier.frequency.setValueAtTime(sound.frequency, context.currentTime);

      return carrier;
    }



  root.Synth = Synth;

})(window);
