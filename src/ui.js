const xtend = require('xtend');
const Constants = require('./constants');

const classTypes = ['mode', 'feature', 'mouse'];

module.exports = function (ctx) {


  const buttonElements = {};
  let activeButton = null;

  let currentMapClasses = {
    mode: null, // e.g. mode-direct_select
    feature: null, // e.g. feature-vertex
    mouse: null // e.g. mouse-move
  };

  let nextMapClasses = {
    mode: null,
    feature: null,
    mouse: null
  };

  function queueMapClasses(options) {
    nextMapClasses = xtend(nextMapClasses, options);
  }

  function updateMapClasses() {
    if (!ctx.container) return;

    const classesToRemove = [];
    const classesToAdd = [];

    classTypes.forEach((type) => {
      if (nextMapClasses[type] === currentMapClasses[type]) return;

      classesToRemove.push(`${type}-${currentMapClasses[type]}`);
      if (nextMapClasses[type] !== null) {
        classesToAdd.push(`${type}-${nextMapClasses[type]}`);
      }
    });

    if (classesToRemove.length > 0) {
      ctx.container.classList.remove.apply(ctx.container.classList, classesToRemove);
    }

    if (classesToAdd.length > 0) {
      ctx.container.classList.add.apply(ctx.container.classList, classesToAdd);
    }

    currentMapClasses = xtend(currentMapClasses, nextMapClasses);
  }

  function createControlButton(id, options = {}) {
    const button = document.createElement('button');
    button.className = `${Constants.classes.CONTROL_BUTTON} ${options.className}`;
    button.setAttribute('title', options.title);
    options.container.appendChild(button);

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const clickedButton = e.target;
      if (clickedButton === activeButton) {
        deactivateButtons();
        return;
      }

      setActiveButton(id);
      options.onActivate();
    }, true);

    return button;
  }

  function createActionButton(id, options = {}) {
    const button = document.createElement('button');
    button.className = `${Constants.classes.ACTION_BUTTON} ${options.className}`;
    button.setAttribute('title', options.title);
    options.container.appendChild(button);

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      options.onAction();
    }, true);

    return button;
  }

  function deactivateButtons() {
    if (!activeButton) return;
    activeButton.classList.remove(Constants.classes.ACTIVE_BUTTON);
    activeButton = null;
  }

  function setActiveButton(id) {
    deactivateButtons();

    const button = buttonElements[id];
    if (!button) return;

    if (button && id !== 'trash') {
      button.classList.add(Constants.classes.ACTIVE_BUTTON);
      activeButton = button;
    }
  }

  function addButtons() {
    const controls = ctx.options.controls;
    const containerGroup = document.createElement('div');
    containerGroup.className = `${Constants.classes.PREDEFINED_CONTROL_BASE} ${Constants.classes.PREDEFINED_CONTROL_GROUP}`;
    if (!controls) return containerGroup;
    const actionGroup = document.createElement('div');
    actionGroup.className = `${Constants.classes.ACTION_GROUP}`;
    const controlGroup = document.createElement('div');
    controlGroup.className = `${Constants.classes.CONTROL_GROUP}`;

    const divider = document.createElement('div');
    divider.className = `${Constants.classes.DIVIDER}`;

    containerGroup.appendChild(actionGroup);
    containerGroup.appendChild(divider);
    containerGroup.appendChild(controlGroup);
    buttonElements["download"] = createActionButton("download", {
      container: actionGroup,
      className: Constants.classes.CONTROL_BUTTON_DOWNLOAD,
      title: `Download snapping lines ${ctx.options.keybindings && '(d)'}`,
      onAction: () => ctx.events.handleDownloadButton()
    });
    buttonElements["select"] = createControlButton("select", {
      container: controlGroup,
      className: Constants.classes.CONTROL_BUTTON_SELECT,
      title: `Select ${ctx.options.keybindings && '(s)'}`,
      onActivate: () => ctx.events.changeMode(Constants.modes.SELECT)
    });
    buttonElements["edit"] = createControlButton("edit", {
      container: controlGroup,
      className: Constants.classes.CONTROL_BUTTON_EDIT,
      title: `Edit ${ctx.options.keybindings && '(e)'}`,
      onActivate: () => ctx.events.changeMode(Constants.modes.DRAW)
    });
    buttonElements["cut"] = createControlButton("cut", {
      container: controlGroup,
      className: Constants.classes.CONTROL_BUTTON_CUT,
      title: `Cut ${ctx.options.keybindings && '(e)'}`,
      onActivate: () => ctx.events.changeMode(Constants.modes.CUT)
    });

    if (controls.trash) {
      buttonElements.trash = createControlButton('trash', {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_TRASH,
        title: 'Delete',
        onActivate: () => {
          ctx.events.trash();
        }
      });
    }

    if (controls.combine_features) {
      buttonElements.combine_features = createControlButton('combineFeatures', {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_COMBINE_FEATURES,
        title: 'Combine',
        onActivate: () => {
          ctx.events.combineFeatures();
        }
      });
    }

    if (controls.uncombine_features) {
      buttonElements.uncombine_features = createControlButton('uncombineFeatures', {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_UNCOMBINE_FEATURES,
        title: 'Uncombine',
        onActivate: () => {
          ctx.events.uncombineFeatures();
        }
      });
    }

    return containerGroup;
  }

  function removeButtons() {
    Object.keys(buttonElements).forEach(buttonId => {
      const button = buttonElements[buttonId];
      if (button.parentNode) {
        button.parentNode.removeChild(button);
      }
      delete buttonElements[buttonId];
    });
  }

  return {
    setActiveButton,
    queueMapClasses,
    updateMapClasses,
    addButtons,
    removeButtons
  };
};
