/**
 * Command Pattern - Encapsulated Requests
 * 
 * Encapsulates requests as objects, allowing:
 * - Queuing operations
 * - Undo/Redo functionality
 * - Delayed execution
 */

class Command {
  execute() { throw new Error('Not implemented'); }
  undo() { throw new Error('Not implemented'); }
}

class LedLight {
  turnOn() { console.log('Light is ON'); }
  turnOff() { console.log('Light is OFF'); }
}

class TurnOnCommand extends Command {
  constructor(light) {
    super();
    this.light = light;
  }

  execute() {
    this.light.turnOn();
  }

  undo() {
    this.light.turnOff();
  }
}

class TurnOffCommand extends Command {
  constructor(light) {
    super();
    this.light = light;
  }

  execute() {
    this.light.turnOff();
  }

  undo() {
    this.light.turnOn();
  }
}

class RemoteControl {
  constructor() {
    this.commands = [];
    this.history = [];
  }

  addCommand(command) {
    this.commands.push(command);
  }

  executeAll() {
    this.commands.forEach(cmd => {
      cmd.execute();
      this.history.push(cmd);
    });
    this.commands = [];
  }

  undoLast() {
    const cmd = this.history.pop();
    if (cmd) cmd.undo();
  }
}

// Usage
const light = new LedLight();
const remote = new RemoteControl();

remote.addCommand(new TurnOnCommand(light));
remote.addCommand(new TurnOffCommand(light));
remote.executeAll();

remote.undoLast();

module.exports = { Command, LedLight, TurnOnCommand, TurnOffCommand, RemoteControl };
