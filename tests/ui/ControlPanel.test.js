import { ControlPanel } from '../../src/ui/ControlPanel.js';
import { FractalState } from '../../src/core/FractalState.js';
import { AnimationController, ANIMATION_TYPES } from '../../src/animations/AnimationController.js';
import { createMockElement } from '../setup.js';

describe('ControlPanel', () => {
  let state;
  let animController;
  let elements;
  let panel;

  beforeEach(() => {
    jest.useFakeTimers();
    
    state = new FractalState();
    animController = new AnimationController(state);
    
    elements = {
      power: createMockElement('input', { value: '2' }),
      powerValue: createMockElement('span', { textContent: '2.0' }),
      maxIter: createMockElement('input', { value: '256' }),
      maxIterValue: createMockElement('span', { textContent: '256' }),
      numberBase: createMockElement('select', { value: '10' }),
      colorScheme: createMockElement('select', { value: '3' }),
      animSpeed: createMockElement('input', { value: '5' }),
      animSpeedValue: createMockElement('span', { textContent: '5' }),
      infoFormula: createMockElement('span'),
      infoBase: createMockElement('span'),
      infoCenter: createMockElement('span'),
      infoZoom: createMockElement('span'),
      infoAnim: createMockElement('span'),
      fpsCounter: createMockElement('span'),
      btnZoom: createMockElement('button'),
      btnRotate: createMockElement('button'),
      btnMorph: createMockElement('button'),
      btnBase: createMockElement('button'),
      btnTour: createMockElement('button'),
      btnJulia: createMockElement('button')
    };
    
    panel = new ControlPanel(state, animController, elements);
  });

  afterEach(() => {
    panel.dispose();
    animController.dispose();
    jest.useRealTimers();
  });

  describe('constructor', () => {
    test('should throw if no state provided', () => {
      expect(() => new ControlPanel(null)).toThrow('FractalState is required');
    });

    test('should create without animation controller', () => {
      const panelNoAnim = new ControlPanel(state, null);
      expect(panelNoAnim).toBeInstanceOf(ControlPanel);
      panelNoAnim.dispose();
    });

    test('should bind controls when elements provided', () => {
      expect(elements.power.addEventListener).toHaveBeenCalledWith('input', expect.any(Function));
    });
  });

  describe('control bindings', () => {
    test('power slider should update state', () => {
      const inputHandler = elements.power.addEventListener.mock.calls.find(
        call => call[0] === 'input'
      )[1];
      
      inputHandler({ target: { value: '3.5' } });
      
      expect(state.get('power')).toBe(3.5);
    });

    test('power slider should update display', () => {
      const inputHandler = elements.power.addEventListener.mock.calls.find(
        call => call[0] === 'input'
      )[1];
      
      inputHandler({ target: { value: '4.0' } });
      
      expect(elements.powerValue.textContent).toBe('4.0');
    });

    test('maxIter slider should update state', () => {
      const inputHandler = elements.maxIter.addEventListener.mock.calls.find(
        call => call[0] === 'input'
      )[1];
      
      inputHandler({ target: { value: '500' } });
      
      expect(state.get('maxIter')).toBe(500);
    });

    test('numberBase select should update state', () => {
      const changeHandler = elements.numberBase.addEventListener.mock.calls.find(
        call => call[0] === 'change'
      )[1];
      
      changeHandler({ target: { value: '16' } });
      
      expect(state.get('numberBase')).toBe(16);
    });

    test('colorScheme select should update state', () => {
      const changeHandler = elements.colorScheme.addEventListener.mock.calls.find(
        call => call[0] === 'change'
      )[1];
      
      changeHandler({ target: { value: '5' } });
      
      expect(state.get('colorScheme')).toBe(5);
    });

    test('animSpeed slider should update animation controller', () => {
      const inputHandler = elements.animSpeed.addEventListener.mock.calls.find(
        call => call[0] === 'input'
      )[1];
      
      inputHandler({ target: { value: '8' } });
      
      expect(animController.getSpeed()).toBe(8);
    });
  });

  describe('loadPreset', () => {
    test('should apply preset to state', () => {
      panel.loadPreset('cubic');
      
      expect(state.get('power')).toBe(3);
    });

    test('should sync controls after preset', () => {
      const syncSpy = jest.spyOn(panel, 'syncControls');
      
      panel.loadPreset('quartic');
      
      expect(syncSpy).toHaveBeenCalled();
    });

    test('should do nothing for invalid preset', () => {
      const initialPower = state.get('power');
      
      panel.loadPreset('nonexistent');
      
      expect(state.get('power')).toBe(initialPower);
    });
  });

  describe('resetView', () => {
    test('should reset state', () => {
      state.update({ zoom: 100, power: 5 });
      
      panel.resetView();
      
      expect(state.get('zoom')).toBe(1);
      expect(state.get('power')).toBe(2);
    });

    test('should stop all animations', () => {
      animController.start(ANIMATION_TYPES.ZOOM);
      
      panel.resetView();
      
      expect(animController.getRunningAnimations()).toEqual([]);
    });
  });

  describe('toggleAnimation', () => {
    test('should toggle animation on', () => {
      const result = panel.toggleAnimation(ANIMATION_TYPES.ZOOM);
      
      expect(result).toBe(true);
      expect(animController.isRunning(ANIMATION_TYPES.ZOOM)).toBe(true);
    });

    test('should toggle animation off', () => {
      animController.start(ANIMATION_TYPES.ZOOM);
      
      const result = panel.toggleAnimation(ANIMATION_TYPES.ZOOM);
      
      expect(result).toBe(false);
      expect(animController.isRunning(ANIMATION_TYPES.ZOOM)).toBe(false);
    });

    test('should return false without animation controller', () => {
      const panelNoAnim = new ControlPanel(state, null);
      
      const result = panelNoAnim.toggleAnimation(ANIMATION_TYPES.ZOOM);
      
      expect(result).toBe(false);
      panelNoAnim.dispose();
    });
  });

  describe('syncControls', () => {
    test('should sync power slider', () => {
      state.update({ power: 6 });
      
      panel.syncControls();
      
      expect(elements.power.value).toBe(6);
      expect(elements.powerValue.textContent).toBe('6.0');
    });

    test('should sync maxIter slider', () => {
      state.update({ maxIter: 800 });
      
      panel.syncControls();
      
      expect(elements.maxIter.value).toBe(800);
      expect(elements.maxIterValue.textContent).toBe(800);
    });

    test('should sync selects', () => {
      state.update({ numberBase: 12, colorScheme: 2 });
      
      panel.syncControls();
      
      expect(elements.numberBase.value).toBe(12);
      expect(elements.colorScheme.value).toBe(2);
    });
  });

  describe('updateDisplay', () => {
    test('should update formula display', () => {
      state.update({ power: 4 });
      panel.updateDisplay();
      
      expect(elements.infoFormula.textContent).toContain('4.0');
    });

    test('should update base display', () => {
      state.update({ numberBase: 16 });
      panel.updateDisplay();
      
      expect(elements.infoBase.textContent).toContain('16');
      expect(elements.infoBase.textContent).toContain('Hexadecimal');
    });

    test('should update center display', () => {
      state.update({ centerX: -0.123456, centerY: 0.654321 });
      panel.updateDisplay();
      
      expect(elements.infoCenter.textContent).toContain('-0.123456');
      expect(elements.infoCenter.textContent).toContain('0.654321');
    });

    test('should update zoom display', () => {
      state.update({ zoom: 123.45 });
      panel.updateDisplay();
      
      expect(elements.infoZoom.textContent).toContain('123.45');
    });
  });

  describe('animation button updates', () => {
    test('should add active class when animation starts', () => {
      animController.start(ANIMATION_TYPES.ZOOM);
      
      expect(elements.btnZoom.classList.add).toHaveBeenCalledWith('active');
    });

    test('should remove active class when animation stops', () => {
      animController.start(ANIMATION_TYPES.ZOOM);
      animController.stop(ANIMATION_TYPES.ZOOM);
      
      expect(elements.btnZoom.classList.remove).toHaveBeenCalledWith('active');
    });

    test('should update infoAnim display', () => {
      animController.start(ANIMATION_TYPES.ZOOM);
      animController.start(ANIMATION_TYPES.COLOR_CYCLE);
      
      expect(elements.infoAnim.textContent).toContain('zoom');
      expect(elements.infoAnim.textContent).toContain('rotate');
    });
  });

  describe('updateFPS', () => {
    test('should update FPS display', () => {
      panel.updateFPS(60);
      
      expect(elements.fpsCounter.textContent).toBe(60);
    });
  });

  describe('state change subscription', () => {
    test('should update display on state change', () => {
      const updateSpy = jest.spyOn(panel, 'updateDisplay');
      
      state.update({ zoom: 5 });
      
      expect(updateSpy).toHaveBeenCalled();
    });

    test('should sync power slider when power changes', () => {
      state.update({ power: 3.5 });
      
      expect(elements.power.value).toBe(3.5);
      expect(elements.powerValue.textContent).toBe('3.5');
    });
  });

  describe('dispose', () => {
    test('should unsubscribe from state', () => {
      const updateSpy = jest.spyOn(panel, 'updateDisplay');
      
      panel.dispose();
      state.update({ zoom: 100 });
      
      // updateDisplay should not be called after dispose
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe('getElements', () => {
    test('should return copy of elements', () => {
      const els = panel.getElements();
      
      expect(els.power).toBe(elements.power);
      expect(els).not.toBe(elements); // Should be a copy
    });
  });
});
