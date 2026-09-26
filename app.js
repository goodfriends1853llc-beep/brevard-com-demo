(() => {
  'use strict';

  const ICONS = {
    MOVE: '↑',
    ABOUT: 'ℹ',
    SERVICES: '✂',
    BOOK: '↗'
  };

  let world = null;
  let viewer = null;
  const interactionIndex = new Map();

  const $ = (id) => document.getElementById(id);
  const entryOverlay = $('entryOverlay');
  const enableMotionButton = $('enableMotion');
  const useTouchButton = $('useTouch');
  const motionToggle = $('motionToggle');
  const entryStatus = $('entryStatus');
  const sceneLabel = $('sceneLabel');
  const modal = $('modal');
  const modalType = $('modalType');
  const modalTitle = $('modalTitle');
  const modalBody = $('modalBody');
  const modalActions = $('modalActions');
  const closeModalButton = $('closeModal');
  const toast = $('toast');

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => { toast.hidden = true; }, 2600);
  }

  function closeModal() {
    modal.hidden = true;
    modalBody.replaceChildren();
    modalActions.replaceChildren();
  }

  function openModal(interaction) {
    modalType.textContent = interaction.interaction_type;
    modalTitle.textContent = interaction.content?.title || interaction.label;
    modalBody.replaceChildren();
    modalActions.replaceChildren();

    if (interaction.interaction_type === 'ABOUT') {
      const p = document.createElement('p');
      p.textContent = interaction.content?.body || '';
      modalBody.appendChild(p);
    }

    if (interaction.interaction_type === 'SERVICES') {
      const list = document.createElement('ul');
      for (const item of interaction.content?.items || []) {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
      }
      modalBody.appendChild(list);

      const bookRef = interaction.content?.book_interaction_ref;
      const bookInteraction = interactionIndex.get(bookRef);
      if (bookInteraction) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'action-button';
        button.textContent = 'BOOK APPOINTMENT';
        button.addEventListener('click', () => executeInteraction(bookInteraction));
        modalActions.appendChild(button);
      }
    }

    modal.hidden = false;
  }

  function executeInteraction(interaction) {
    if (!interaction) return;

    switch (interaction.interaction_type) {
      case 'MOVE':
        viewer.loadScene(interaction.target_scene);
        break;
      case 'ABOUT':
      case 'SERVICES':
        openModal(interaction);
        break;
      case 'BOOK': {
        const url = interaction.action?.url;
        if (!url) {
          showToast('No booking action is configured.');
          return;
        }
        showToast('Commercial BOOK action reached. Opening demo endpoint…');
        const opened = window.open(url, '_blank', 'noopener,noreferrer');
        if (!opened) window.location.assign(url);
        break;
      }
      default:
        showToast(`Unsupported interaction: ${interaction.interaction_type}`);
    }
  }

  function buildHotspotElement(hotSpotDiv, args) {
    hotSpotDiv.setAttribute('role', 'button');
    hotSpotDiv.setAttribute('tabindex', '0');
    hotSpotDiv.setAttribute('aria-label', args.label);

    const pill = document.createElement('div');
    pill.className = 'hs-pill';

    const icon = document.createElement('span');
    icon.className = 'hs-icon';
    icon.textContent = ICONS[args.interactionType] || '•';

    const label = document.createElement('span');
    label.textContent = args.label;

    pill.append(icon, label);
    hotSpotDiv.appendChild(pill);

    hotSpotDiv.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        executeInteraction(interactionIndex.get(args.interactionId));
      }
    });
  }

  function buildPannellumScene(scene) {
    const hotspots = (scene.interactions || []).map((interaction) => {
      interactionIndex.set(interaction.interaction_id, interaction);
      return {
        pitch: interaction.pitch,
        yaw: interaction.yaw,
        type: 'info',
        cssClass: 'brevard-hotspot',
        createTooltipFunc: buildHotspotElement,
        createTooltipArgs: {
          interactionId: interaction.interaction_id,
          interactionType: interaction.interaction_type,
          label: interaction.label
        },
        clickHandlerFunc: () => executeInteraction(interaction)
      };
    });

    return {
      type: 'equirectangular',
      panorama: scene.representation.asset,
      title: scene.label,
      pitch: scene.view?.pitch ?? 0,
      yaw: scene.view?.yaw ?? 0,
      hfov: scene.view?.hfov ?? 90,
      northOffset: scene.view?.north_offset ?? 0,
      hotSpots: hotspots
    };
  }

  function buildViewerConfig() {
    const scenes = {};
    for (const [sceneId, scene] of Object.entries(world.scenes)) {
      scenes[sceneId] = buildPannellumScene(scene);
    }

    return {
      default: {
        firstScene: 'street-001',
        autoLoad: true,
        sceneFadeDuration: 700,
        orientationOnByDefault: false,
        showZoomCtrl: false,
        showFullscreenCtrl: true,
        compass: false,
        friction: 0.18,
        escapeHTML: true
      },
      scenes
    };
  }

  function updateSceneHud(sceneId) {
    const scene = world.scenes[sceneId];
    sceneLabel.textContent = scene?.label || sceneId;
  }

  async function requestMotionLook() {
    entryStatus.textContent = 'Requesting motion access…';
    try {
      if (typeof window.DeviceOrientationEvent !== 'undefined' &&
          typeof window.DeviceOrientationEvent.requestPermission === 'function') {
        const result = await window.DeviceOrientationEvent.requestPermission();
        if (result !== 'granted') {
          entryStatus.textContent = 'Motion permission was not granted. Touch controls are still available.';
          return false;
        }
      }

      viewer.startOrientation();
      await new Promise((resolve) => window.setTimeout(resolve, 120));
      const active = viewer.isOrientationActive();
      entryStatus.textContent = active
        ? 'Motion look enabled.'
        : 'Motion data was not detected. Touch controls remain available.';
      return active;
    } catch (error) {
      console.error('Motion permission error:', error);
      entryStatus.textContent = 'Motion look could not start. Touch controls remain available.';
      return false;
    }
  }

  function setEntryComplete(mode) {
    entryOverlay.hidden = true;
    motionToggle.hidden = false;
    motionToggle.textContent = mode === 'motion' ? 'Motion: ON' : 'Motion: OFF';
  }

  enableMotionButton.addEventListener('click', async () => {
    const active = await requestMotionLook();
    setEntryComplete(active ? 'motion' : 'touch');
  });

  useTouchButton.addEventListener('click', () => {
    if (viewer?.isOrientationActive()) viewer.stopOrientation();
    setEntryComplete('touch');
  });

  motionToggle.addEventListener('click', async () => {
    if (!viewer) return;
    if (viewer.isOrientationActive()) {
      viewer.stopOrientation();
      motionToggle.textContent = 'Motion: OFF';
      showToast('Touch look enabled.');
    } else {
      const active = await requestMotionLook();
      motionToggle.textContent = active ? 'Motion: ON' : 'Motion: OFF';
      showToast(active ? 'Motion look enabled.' : 'Using touch look.');
    }
  });

  closeModalButton.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeModal(); });

  async function boot() {
    try {
      const response = await fetch('world.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`world.json HTTP ${response.status}`);
      world = await response.json();

      viewer = pannellum.viewer('panorama', buildViewerConfig());
      updateSceneHud('street-001');

      viewer.on('scenechange', (sceneId) => {
        updateSceneHud(sceneId);
        closeModal();
      });

      viewer.on('error', (message) => {
        console.error('Pannellum error:', message);
        showToast('Viewer error. Check the console for details.');
      });

      entryStatus.textContent = 'World runtime ready.';
    } catch (error) {
      console.error(error);
      entryStatus.textContent = `Runtime failed to load: ${error.message}`;
      enableMotionButton.disabled = true;
      useTouchButton.disabled = true;
    }
  }

  boot();
})();
