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

  function createButtonDropdown() {
    const group = document.createElement('div');
    return group;
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
    const dropdownGroup = document.createElement('div');
    dropdownGroup.className = `${Constants.classes.DROPDOWN_GROUP}`;
    dropdownGroup.style.display = 'none';

    const divider = document.createElement('div');
    divider.className = `${Constants.classes.DIVIDER}`;

    containerGroup.appendChild(actionGroup);
    containerGroup.appendChild(dropdownGroup);
    containerGroup.appendChild(divider);
    containerGroup.appendChild(controlGroup);


    buttonElements["downloadWays"] = createActionButton("downloadWays", {
      container: actionGroup,
      className: Constants.classes.CONTROL_BUTTON_DOWNLOAD,
      title: `Download way lines ${ctx.options.keybindings && '(d)'}`,
      onAction: () => ctx.events.handleWaysDownloadButton()
    });
    buttonElements["downloadBuildings"] = createActionButton("downloadBuildings", {
      container: actionGroup,
      className: Constants.classes.CONTROL_BUTTON_DOWNLOAD,
      title: `Download building lines ${ctx.options.keybindings && '(d)'}`,
      onAction: () => ctx.events.handleBuildingsDownloadButton()
    });
    buttonElements["loadData"] = createActionButton("loadData", {
      container: actionGroup,
      className: Constants.classes.CONTROL_BUTTON_LOAD_DATA,
      title: `Upload GeoJson, KML or GPX from PC`,
      onAction: () => ctx.events.handleLoadDataButton()
    });
    buttonElements["saveFile"] = createActionButton("saveFile", {
      container: actionGroup,
      className: Constants.classes.CONTROL_BUTTON_SAVE,
      title: `Export as Gist, GeoJson, KML`,
      onAction: () => ctx.events.handleSaveButton()
    });
    buttonElements["saveAsGist"] = createActionButton("saveAsGist", {
      container: dropdownGroup,
      className: Constants.classes.CONTROL_BUTTON_SAVE_AS_GIST,
      title: `Export as Gist`,
      onAction: () => ctx.events.handleSaveAsGistButton()
    });
    buttonElements["saveAsGeojson"] = createActionButton("saveAsGeojson", {
      container: dropdownGroup,
      className: Constants.classes.CONTROL_BUTTON_SAVE_AS_GEOJSON,
      title: `Export as Geojson`,
      onAction: () => ctx.events.handleSaveAsGeojsonButton()
    });
    buttonElements["saveAsKML"] = createActionButton("saveAsKML", {
      container: dropdownGroup,
      className: Constants.classes.CONTROL_BUTTON_SAVE_AS_KML,
      title: `Export as KML`,
      onAction: () => ctx.events.handleSaveAsKmlButton()
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
    buttonElements["combine"] = createActionButton("combine", {
      container: controlGroup,
      className: Constants.classes.CONTROL_BUTTON_COMBINE_FEATURES,
      title: `Combine ${ctx.options.keybindings && '(e)'}`,
      onAction: () => ctx.events.combineFeatures()
    });
    buttonElements["delete"] = createActionButton("delete", {
      container: controlGroup,
      className: Constants.classes.CONTROL_BUTTON_DELETE,
      title: `Delete data ${ctx.options.keybindings && '(e)'}`,
      onAction: () => ctx.events.deleteUserData()
    });
    buttonElements["delete-snap"] = createActionButton("delete-snap", {
      container: controlGroup,
      className: Constants.classes.CONTROL_BUTTON_DELETE_SNAP,
      title: `Delete snap data ${ctx.options.keybindings && '(e)'}`,
      onAction: () => ctx.api.deleteSnapData()
    });
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
