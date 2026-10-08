/* Original procedural micro-sounds. No files, streaming, persistence or credential input. */
(function () {
  'use strict';
  var enabled = false, epoch = 0, audio = null, voices = new Set();
  function stop() {
    epoch++;
    voices.forEach(function (voice) {
      try { voice.gain.gain.cancelScheduledValues(audio.currentTime); voice.gain.gain.setValueAtTime(0, audio.currentTime); } catch (_) {}
      try { voice.source.stop(); } catch (_) {}
    });
    voices.clear();
    if (audio) audio.suspend().catch(function () {});
  }
  function setEnabled(value) { enabled = value === true; if (!enabled) stop(); return enabled; }
  function play(kind, intensity) {
    if (!enabled || !['privacy','peek','signature'].includes(kind)) return;
    try {
      var Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      if (!audio) audio = new Audio();
      var token = epoch, level = intensity === .35 ? .35 : 1;
      var schedule = function () {
        if (!enabled || token !== epoch) return;
        var now = audio.currentTime;
        function voice(source, duration, gain, offset, filter) {
          var amp = audio.createGain(), t = now + (offset || 0), item = {source:source,gain:amp};
          amp.gain.setValueAtTime(0, t);
          amp.gain.linearRampToValueAtTime(gain * level, t + Math.min(.024, duration / 5));
          amp.gain.exponentialRampToValueAtTime(.00001, t + duration);
          if (filter) { source.connect(filter); filter.connect(amp); } else source.connect(amp);
          amp.connect(audio.destination); voices.add(item);
          source.onended = function () { voices.delete(item); source.disconnect(); amp.disconnect(); if (filter) filter.disconnect(); };
          source.start(t); source.stop(t + duration);
        }
        if (kind === 'privacy') {
          var buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * .34), audio.sampleRate), samples = buffer.getChannelData(0), smooth = 0;
          for (var i = 0; i < samples.length; i++) { smooth = .62 * smooth + .38 * (Math.random() * 2 - 1); samples[i] = smooth; }
          var rustle = audio.createBufferSource(), band = audio.createBiquadFilter();
          rustle.buffer = buffer; band.type = 'bandpass'; band.frequency.setValueAtTime(1700, now); band.frequency.exponentialRampToValueAtTime(950, now + .34); band.Q.value = .7;
          voice(rustle, .34, .035, 0, band);
        } else if (kind === 'peek') {
          var wood = audio.createOscillator(); wood.type = 'sine'; wood.frequency.setValueAtTime(270, now); wood.frequency.exponentialRampToValueAtTime(155, now + .065);
          voice(wood, .085, .012);
        } else {
          var drop = audio.createOscillator(), glass = audio.createOscillator();
          drop.type = 'sine'; drop.frequency.setValueAtTime(1174.66, now); drop.frequency.exponentialRampToValueAtTime(659.25, now + .075);
          glass.type = 'sine'; glass.frequency.value = 987.77;
          voice(drop, .36, .024); voice(glass, .5, .011, .14);
        }
      };
      if (audio.state === 'suspended') audio.resume().then(schedule).catch(function () {}); else schedule();
    } catch (_) { /* Optional sound must never interrupt authentication. */ }
  }
  window.NSAuthSonics = {setEnabled:setEnabled,play:play,stop:stop};
})();
