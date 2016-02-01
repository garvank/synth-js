# SynthJS
An API to work with WebAudio API to generate sounds. 
Make a new synth like so:
```javascript
var mySynth = new Synth();
```

## Examples
You can make sounds as simple objects. 
For example, let's make 3 simple beeps tuned to A, D, & F#:
```javascript
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
```

### Play an individual sound
```javascript
mySynth.play(beep_a);
```

### Sequence a track of sounds
```javascript
var track = [beep_a, beep_d, beep_fsharp],
    bpm   = 200,
    loops = 1; // Currently a todo
    
mySynth.sequence(track, bpm, loops);
```

### Add a pitchbend
Simply include a hew hash with the key ramp, to specify the frequency you'd like to bend to.
```javascript
var bender_bass = {
  type: 'sine',
  frequency: 100,
  duration: .3,
  ramp: {
    to: 50
  }
};
```
