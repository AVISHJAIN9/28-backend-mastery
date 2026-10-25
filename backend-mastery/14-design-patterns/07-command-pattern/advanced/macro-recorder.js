/**
 * ADVANCED: Command with Macro Recording
 * 
 * Record and playback command sequences.
 */

class MacroRecorder {
  constructor() {
    this.recording = false;
    this.macros = new Map();
    this.currentMacro = [];
  }

  startRecording(name) {
    this.recording = true;
    this.currentMacro = [];
    console.log(`Recording macro: ${name}`);
  }

  recordCommand(command) {
    if (this.recording) {
      this.currentMacro.push(command);
      console.log(`Recorded: ${command.constructor.name}`);
    }
  }

  stopRecording(name) {
    this.recording = false;
    this.macros.set(name, [...this.currentMacro]);
    console.log(`Macro "${name}" saved with ${this.currentMacro.length} commands`);
    this.currentMacro = [];
  }

  playMacro(name) {
    const commands = this.macros.get(name);
    if (!commands) throw new Error(`Macro not found: ${name}`);

    console.log(`\nPlaying macro: ${name}`);
    commands.forEach(cmd => cmd.execute());
  }

  listMacros() {
    return Array.from(this.macros.keys());
  }
}

// Example commands
class SettingCommand {
  constructor(setting, value) {
    this.setting = setting;
    this.value = value;
  }

  execute() {
    console.log(`  Setting ${this.setting} = ${this.value}`);
  }
}

// Usage
const recorder = new MacroRecorder();

// Record a startup sequence
recorder.startRecording('startup');
recorder.recordCommand(new SettingCommand('debug', 'on'));
recorder.recordCommand(new SettingCommand('logging', 'verbose'));
recorder.recordCommand(new SettingCommand('cache', 'enabled'));
recorder.stopRecording('startup');

// Playback
recorder.playMacro('startup');
console.log('\nAvailable macros:', recorder.listMacros());

module.exports = MacroRecorder;
