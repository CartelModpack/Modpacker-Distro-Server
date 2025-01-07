// ELEMENTS

// Form Inputs

/**
 * The form input for elements to remove.
 * @type {HTMLInputElement}
 */
const REMOVAL_LIST_INPUT = document.getElementById("to_remove");
/**
 * The form input for elements to add.
 * @type {HTMLInputElement}
 */
const ADDITION_LIST_INPUT = document.getElementById("to_add");
/**
 * The form input for elements to update.
 * @type {HTMLInputElement}
 */
const UPDATES_LIST_INPUT = document.getElementById("to_update");

// Persistant Items

/**
 * Contains the existing items out of the way.
 * @type {HTMLSpanElement}
 */
const PERSISTANT_EXISTING = document.getElementById("persistant_existing");
/**
 * Contains the currently visible item out of the way.
 * @type {HTMLSpanElement}
 */
const PERSISTANT_CURRENT_LOADED = document.getElementById("persistant_loaded");

// Indicators

/**
 * The indicator that says if items are in the item list.
 * @type {HTMLDivElement}
 */
const NO_ITEMS_INDICATOR = document.getElementById("no_items_indicator");
/**
 * The indicator that says you need to select an item first.
 * @type {HTMLDivElement}
 */
const VISIBLE_DISPLAY_INDICATOR = document.getElementById(
  "visible_display_indicator"
);

// Visible Data

/**
 * The visible display for editing.
 * @type {HTMLDivElement}
 */
const VISIBLE_DISPLAY = document.getElementById("visible_display");
/**
 * The visible icon when editing.
 * @type {HTMLImageElement}
 */
const VISIBLE_ICON = document.getElementById("visible_icon");
/**
 * The visible name when editing.
 * @type {HTMLParagraphElement}
 */
const VISIBLE_NAME = document.getElementById("visible_name");
/**
 * The visible input for versions
 * @type {HTMLInputElement}
 */
const VISIBLE_VERSIONS = document.getElementById("visible_versions");
/**
 * The visible tags when editing.
 * @type {HTMLParagraphElement}
 */
const VISIBLE_TAGS = document.getElementById("visible_tags");
/**
 * The visible description when editing.
 * @type {HTMLParagraphElement}
 */
const VISIBLE_DESCRIPTION = document.getElementById("visible_description");

// HELPER FUNCTIONS

// ids

/** Get all IDs to remove. */
function getRemovals() {
  return JSON.parse(REMOVAL_LIST_INPUT.value);
}
/** Add a new removal ID. */
function addRemoval(id) {
  let items = getRemovals();
  if (!items.includes(id)) items.push(id);
  REMOVAL_LIST_INPUT.value = JSON.stringify(items);
}

/** Get all IDs to add. */
function getAdditons() {
  return JSON.parse(ADDITION_LIST_INPUT.value);
}
/** Add a new addition ID. */
function addAdditon(id) {
  let items = getAdditons();
  if (!items.includes(id)) items.push(id);
  ADDITION_LIST_INPUT.value = JSON.stringify(items);
}

/** Get all IDs to update. */
function getUpdates() {
  return JSON.parse(UPDATES_LIST_INPUT.value);
}
/** Add a new update ID. */
function addUpdate(id, values) {
  let items = getUpdates();
  if (items[id] == null) items[id] = values;
  UPDATES_LIST_INPUT.value = JSON.stringify(items);
}

// Display items

/**
 * "Dirty" items from display data to db use.
 * @param items Clean items.
 * @returns A "dirty" array of the same data.
 */
function uncleanItemsData(items) {
  let out = [];

  for (let item of items) {
    out.push({
      project_id: item.project_id,
      project_name: item.project_name,
      project_source: item.project_source,
      applied_versions: JSON.stringify(
        item.applied_versions.trim().replaceAll(" ", "").split(",")
      ),
      tags: JSON.stringify(item.tags.trim().replaceAll(" ", "").split(",")),
    });
  }

  return out;
}

/** Toggle the no items indicator. */
function toggleNoItemsIndicator(value) {
  if (NO_ITEMS_INDICATOR.classList.contains("hidden")) {
    if (value != null && !value) return;
    NO_ITEMS_INDICATOR.classList.remove("hidden");
    NO_ITEMS_INDICATOR.classList.add("flex");
  } else {
    if (value != null && value) return;
    NO_ITEMS_INDICATOR.classList.remove("flex");
    NO_ITEMS_INDICATOR.classList.add("hidden");
  }
}

/** Load content from modrinth. */
function loadResourceFromModrinth(project_id, usage, elements = {}, callback) {
  MODRINTH_API.project(project_id)
    .then((content) => {
      if (elements.icon != null) elements.icon.src = content.icon_url;
      if (elements.title != null) elements.title.innerHTML = content.title;
      if (elements.description != null)
        elements.description.innerHTML = content.description;

      if (elements.versions != null) elements.versions.value = usage.versions;
      if (elements.tags != null) elements.tags.innerHTML = usage.tags;
      callback();
    })
    .catch((error) => {
      console.error(error);
      callback();
    });
}

/** Load content from a source */
function loadResourceFromSource(
  project_id,
  source,
  usage,
  elements = {},
  callback = () => {}
) {
  if (source === "modrinth") {
    loadResourceFromModrinth(project_id, usage, elements, callback);
  } else {
    console.warn("Don't know how to load this resource!");
    callback();
  }
}

/** Change the display item that is shown */
function changeDisplayItem(project_id) {
  if (PERSISTANT_CURRENT_LOADED.dataset["loaded"] != project_id) {
    console.info(`Loading ${project_id} into viewer...`);

    const old_project_id = PERSISTANT_CURRENT_LOADED.dataset["loaded"];
    PERSISTANT_CURRENT_LOADED.dataset["loaded"] = project_id;

    const old_item = document.querySelector(
      `[data-item-id="${old_project_id}"]`
    );
    const new_item = document.querySelector(`[data-item-id="${project_id}"]`);
    const project_source = new_item.dataset["itemSource"];

    loadResourceFromSource(
      project_id,
      project_source,
      {
        versions: new_item.dataset["itemVersions"],
      },
      {
        icon: VISIBLE_ICON,
        title: VISIBLE_NAME,
        description: VISIBLE_DESCRIPTION,
        versions: VISIBLE_VERSIONS,
      },
      () => {
        if (old_item != null) {
          old_item.classList.remove("bg-slate-50");
        }
        new_item.classList.add("bg-slate-50");

        if (VISIBLE_DISPLAY.classList.contains("hidden")) {
          VISIBLE_DISPLAY_INDICATOR.classList.add("hidden");
          VISIBLE_DISPLAY.classList.remove("hidden");
        }
      }
    );
  }
}

/** Load all currently visible resource info from modrinth. */
function loadResourceInfo() {
  const items = document.querySelectorAll("[data-item-id]");
  if (items.length >= 1) {
    toggleNoItemsIndicator(false);

    items.forEach((item) => {
      const project_id = item.dataset["itemId"];
      const project_source = item.dataset["itemSource"];

      const icon = item.children[0];
      const title = item.children[1].children[0];

      loadResourceFromSource(project_id, project_source, {}, { icon, title });
    });

    changeDisplayItem(items[0].dataset["itemId"]);
  } else {
    toggleNoItemsIndicator(true);
  }
}

// RUN ON LOAD
loadResourceInfo();
