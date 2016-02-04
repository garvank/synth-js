(function (root) {

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
      ramp: {
        to: 70
      }
    },
    snare: {
      type: 'square',
      frequency: 100,
      duration: .05,
    },
    beep_a: {
      type: 'triangle',
      frequency: 440,
      duration: .2,
      filter: {
        frequency: 1000,
        type: 'highpass',
        gain: 25
      }
    },
    beep_d: {
      type: 'triangle',
      frequency: 587.33,
      duration: .2,
      filter: {
        frequency: 1000,
        type: 'highpass',
        gain: 25
      }
    },
    beep_fsharp: {
      type: 'triangle',
      frequency: 739.99,
      duration: .2,
      filter: {
        frequency: 1000,
        type: 'highpass',
        gain: 25
      }
    }
  };

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
   *  Accepts a "sound" object and plays it
   */
  Synth.prototype.play = function(sound){

    var filter;
    var destination;

    // Supported: ['sine', 'triangle', 'sawtooth', 'square']
    this.carrier = this.context.createOscillator();
    this.carrier.type = sound.type;
    this.carrier.frequency.setValueAtTime(sound.frequency, this.context.currentTime);

    destination = this.context.createGain();
    destination.gain.value = 0.5;
    destination.connect(this.context.destination);
    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = 1;
    this.gainNode.connect(destination);
    this.carrier.connect(this.gainNode);

    // Manipulate frequency over time
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

  Synth.prototype.stop = function () {
    this.gainNode.gain.value = 0;
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

  Synth.prototype.gain = function (gain) {
    this.gainNode.gain.value = gain;
  }


  root.Synth = Synth;
})(window);
