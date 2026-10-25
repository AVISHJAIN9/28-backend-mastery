/**
 * ADVANCED: Abstract Factory Pattern
 * 
 * Creates families of related objects.
 * Ensures consistency across product types.
 */

// Abstract interfaces
class UITheme {
  createButton() { throw new Error('Not implemented'); }
  createInput() { throw new Error('Not implemented'); }
  createLabel() { throw new Error('Not implemented'); }
}

// Dark theme family
class DarkButton { render() { return '<button class="dark">'; } }
class DarkInput { render() { return '<input class="dark">'; } }
class DarkLabel { render() { return '<label class="dark">'; } }

class DarkTheme extends UITheme {
  createButton() { return new DarkButton(); }
  createInput() { return new DarkInput(); }
  createLabel() { return new DarkLabel(); }
}

// Light theme family
class LightButton { render() { return '<button class="light">'; } }
class LightInput { render() { return '<input class="light">'; } }
class LightLabel { render() { return '<label class="light">'; } }

class LightTheme extends UITheme {
  createButton() { return new LightButton(); }
  createInput() { return new LightInput(); }
  createLabel() { return new LightLabel(); }
}

// Factory
class ThemeFactory {
  static createTheme(type) {
    const themes = {
      'dark': DarkTheme,
      'light': LightTheme
    };
    const ThemeClass = themes[type];
    if (!ThemeClass) throw new Error(`Unknown theme: ${type}`);
    return new ThemeClass();
  }
}

// Usage
const darkTheme = ThemeFactory.createTheme('dark');
console.log(darkTheme.createButton().render());
console.log(darkTheme.createInput().render());

const lightTheme = ThemeFactory.createTheme('light');
console.log(lightTheme.createButton().render());

module.exports = ThemeFactory;
