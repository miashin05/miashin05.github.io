document.addEventListener("DOMContentLoaded", function(event) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const globalGain = audioCtx.createGain(); //this will control the volume of all notes
    globalGain.gain.setValueAtTime(0.8, audioCtx.currentTime)
    globalGain.connect(audioCtx.destination);


    const keyboardFrequencyMap = {
        '90': 261.625565300598634,  //Z - C
        '83': 277.182630976872096, //S - C#
        '88': 293.664767917407560,  //X - D
        '68': 311.126983722080910, //D - D#
        '67': 329.627556912869929,  //C - E
        '86': 349.228231433003884,  //V - F
        '71': 369.994422711634398, //G - F#
        '66': 391.995435981749294,  //B - G
        '72': 415.304697579945138, //H - G#
        '78': 440.000000000000000,  //N - A
        '74': 466.163761518089916, //J - A#
        '77': 493.883301256124111,  //M - B
        '81': 523.251130601197269,  //Q - C
        '50': 554.365261953744192, //2 - C#
        '87': 587.329535834815120,  //W - D
        '51': 622.253967444161821, //3 - D#
        '69': 659.255113825739859,  //E - E
        '82': 698.456462866007768,  //R - F
        '53': 739.988845423268797, //5 - F#
        '84': 783.990871963498588,  //T - G
        '54': 830.609395159890277, //6 - G#
        '89': 880.000000000000000,  //Y - A
        '55': 932.327523036179832, //7 - A#
        '85': 987.766602512248223,  //U - B
    }
    
    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);
    
    activeOscillators = {};

    function setBackground(frequency){
        const base = 220;
        const hue = ((Math.log2(frequency / base) * 360) % 360 + 360) % 360;
        const brightness = 70;

        document.documentElement.style.transition = "background-color 80ms linear";
        document.documentElement.style.backgroundColor = `hsl(${hue}, 100%, ${brightness}%`;

    }


    function updateBackground(){
        const activeKeys = Object.keys(activeOscillators);
        if(activeKeys.length == 0){
            document.documentElement.style.backgroundColor = "";
            return;
        }

        frequencySum = 0;
        for (const key of activeKeys){
            frequencySum += activeOscillators[key].osc.frequency.value;
        }

        const averageFrequency = frequencySum / activeKeys.length;
        setBackground(averageFrequency);
    }


    function updateKeyGains(){
        const currentTime = audioCtx.currentTime;
        const keys = Object.keys(activeOscillators);
        const keysPlayed = Math.max(1, keys.length);
        const targetGain = (1.0 / keysPlayed) * 0.9;

        for (const k of keys){
            const currentGain = activeOscillators[k].gainNode.gain;
            currentGain.cancelScheduledValues(currentTime);
            const startVal = Math.max(0.0001, currentGain.value);
            currentGain.setValueAtTime(startVal, currentTime);
            currentGain.exponentialRampToValueAtTime(targetGain, currentTime + 0.06)

        }

        updateBackground();

    }

    
    function keyDown(event) {
        if (event.repeat) return;
        
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
          playNote(key);
        }
    }
    

    function keyUp(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && activeOscillators[key]) {
            const {osc, gainNode} = activeOscillators[key];
            const currentTime = audioCtx.currentTime;

            gainNode.gain.cancelScheduledValues(currentTime);    
            gainNode.gain.setValueAtTime(Math.max(gainNode.gain.value, 0.0001), currentTime);      

            gainNode.gain.exponentialRampToValueAtTime(0.0001, currentTime + 0.03);

            osc.stop(currentTime + 0.04);
            
            osc.onended = () => {
                delete activeOscillators[key];
                updateKeyGains();
            };
        }
    }
    

    let currentWaveform = "sine";

    const waveformSelection = document.getElementById("waveform");
    waveformSelection.addEventListener("change", function(){
        currentWaveform = waveformSelection.value;
    });


    function playNote(key) {
        const osc = audioCtx.createOscillator();
        osc.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime)
        osc.type = currentWaveform;

        const gainNode = audioCtx.createGain();
        const currentTime = audioCtx.currentTime;

        gainNode.gain.setValueAtTime(0.0001, currentTime);

        osc.connect(gainNode);
        gainNode.connect(globalGain);

        osc.start(currentTime);
        activeOscillators[key] = {osc, gainNode}

        updateKeyGains();

      }


});




