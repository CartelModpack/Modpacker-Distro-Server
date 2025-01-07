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
/**
 * The new item popup element.
 * @type {HTMLDivElement}
 */
const NEW_ITEM_POPUP = document.getElementById("new_item_popup");
const NEW_ITEM_INDICATOR = document.getElementById("new_item_indicator");

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
 * The visible description when editing.
 * @type {HTMLParagraphElement}
 */
const VISIBLE_DESCRIPTION = document.getElementById("visible_description");

const NEW_ITEM_ID = document.getElementById("new_item_id");
const NEW_ITEM_SOURCE = document.getElementById("new_item_source_dd");
const NEW_ITEM_VERSIONS = document.getElementById("new_item_vers");
const NEW_ITEM_RAWCONTENT = document.getElementById("new_item_rawcontent");
const NEW_ITEM_NAME = document.getElementById("new_item_name_input");
const NEW_ITEM_RAWCONTENT_DISPLAY = document.getElementById(
  "new_item_rawcontent_disp"
);

const NEW_ITEM_DISPLAY_ICON = document.getElementById("new_item_icon");
const NEW_ITEM_DISPLAY_NAME = document.getElementById("new_item_name");
const NEW_ITEM_DISPLAY_VERSIONS = document.getElementById("new_item_versions");
const NEW_ITEM_DISPLAY_SOURCE = document.getElementById("new_item_source");

const ITEM_LIST = document.getElementById("item_list");

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
function addAdditon(id, name, versions) {
  let items = getAdditons();
  if (items[id] == null)
    items[id] = {
      name,
      versions,
    };
  ADDITION_LIST_INPUT.value = JSON.stringify(items);
}

/** Get all IDs to update. */
function getUpdates() {
  return JSON.parse(UPDATES_LIST_INPUT.value);
}
/** Add a new update ID. */
function addUpdate(id, name, versions) {
  let items = getUpdates();
  if (items[id] == null)
    items[id] = {
      name,
      versions,
    };
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

function toggleNewItemPopup(value) {
  if (NEW_ITEM_POPUP.classList.contains("hidden")) {
    if (value != null && !value) return;
    NEW_ITEM_POPUP.classList.remove("hidden");
    NEW_ITEM_ID.value = "";
    NEW_ITEM_NAME.value = "";
    NEW_ITEM_RAWCONTENT.value = "";
    NEW_ITEM_SOURCE.value = "modrinth";
    NEW_ITEM_VERSIONS.value = "";
    NEW_ITEM_DISPLAY_ICON.src = "/api/v1/icons/temp";
    NEW_ITEM_DISPLAY_NAME.innerHTML = "No Title";
    NEW_ITEM_DISPLAY_SOURCE = "modrinth";
    NEW_ITEM_DISPLAY_VERSIONS.innerHTML =
      "[No versions specified, this will be included in ALL versions.]";
    displayNewItemMessage();
    displayRawFields();
  } else {
    if (value != null && value) return;
    NEW_ITEM_POPUP.classList.add("hidden");
  }
}

/** Load content from modrinth. */
function loadResourceFromModrinth(project_id, usage, elements = {}, callback) {
  if (project_id.trim() == "") {
    console.error(new Error("No ID Specified."));
    callback(false);
    return;
  }
  MODRINTH_API.project(project_id)
    .then((content) => {
      if (elements.icon != null) elements.icon.src = content.icon_url;
      if (elements.title != null) elements.title.innerHTML = content.title;
      if (elements.description != null)
        elements.description.innerHTML = content.description;

      if (elements.versions != null) elements.versions.value = usage.versions;
      if (elements.source != null) elements.source.innerHTML = "modrinth";
      callback(true);
    })
    .catch((error) => {
      console.error(error);
      callback(false);
    });
}

function embedInTextarea(content, id) {
  const rows = content.split("\n").length;
  return `<textarea class="text-xs w-full input-text hover:no-underline resize-none" rows="${
    rows < 16 ? rows : 16
  }" id="${id}">${content}</textarea>`;
}

/** Load content from raw. */
function loadResourceFromRaw(usage, elements = {}, callback) {
  let content = {
    icon_url: "/api/v1/icons/temp",
    title: usage.name.trim() != "" ? usage.name.trim() : "No Title",
  };

  if (elements.icon != null) elements.icon.src = content.icon_url;
  if (elements.title != null) elements.title.innerHTML = content.title;
  if (elements.versions != null) elements.versions.value = usage.versions;
  if (elements.description != null)
    elements.description.innerHTML = embedInTextarea(
      usage.content != null
        ? JSON.stringify(JSON.parse(usage.content), null, 2)
        : "No content provided.",
      "update_raw_content"
    );
  if (elements.source != null) elements.source.innerHTML = "raw";
  callback(true);
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
  } else if (source === "raw") {
    loadResourceFromRaw(usage, elements, callback);
  } else {
    console.warn("Don't know how to load this resource!");
    callback(false);
  }
}

/** Display a new item message */
function displayNewItemMessage(msg = null) {
  if (msg != null) {
    NEW_ITEM_INDICATOR.innerHTML = msg;
    NEW_ITEM_INDICATOR.classList.remove("hidden");
  } else {
    NEW_ITEM_INDICATOR.classList.add("hidden");
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
        name: new_item.dataset["itemName"],
        versions: new_item.dataset["itemVersions"],
        content: new_item.dataset["itemContent"],
      },
      {
        icon: VISIBLE_ICON,
        title: VISIBLE_NAME,
        description: VISIBLE_DESCRIPTION,
        versions: VISIBLE_VERSIONS,
      },
      (success) => {
        if (success) {
          if (old_item != null) {
            old_item.classList.remove("bg-slate-50");
          }
          new_item.classList.add("bg-slate-50");

          if (VISIBLE_DISPLAY.classList.contains("hidden")) {
            VISIBLE_DISPLAY_INDICATOR.classList.add("hidden");
            VISIBLE_DISPLAY.classList.remove("hidden");
          }
        }
      }
    );
  }
}

/** Load all currently visible resource info from the APIs. */
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

/** Load new item content. */
function loadNewItemFromAPI() {
  const project_id = NEW_ITEM_ID.value;
  const project_source = NEW_ITEM_SOURCE.value;

  loadResourceFromSource(
    project_id,
    project_source,
    { name: NEW_ITEM_NAME.value },
    {
      icon: NEW_ITEM_DISPLAY_ICON,
      title: NEW_ITEM_DISPLAY_NAME,
      source: NEW_ITEM_DISPLAY_SOURCE,
    },
    (success) => {
      if (success) {
        displayNewItemMessage();
        NEW_ITEM_DISPLAY_VERSIONS.innerHTML =
          NEW_ITEM_VERSIONS.value.trim() == ""
            ? "[No versions specified, this will be included in ALL versions.]"
            : NEW_ITEM_VERSIONS.value.replaceAll(" ", "").split(",").join(", ");
      } else {
        if (project_id.trim() === "") {
          displayNewItemMessage(`No project id specified.`);
        } else {
          displayNewItemMessage(
            `Failed to load project id ${project_id} from ${project_source}.`
          );
        }
      }
    }
  );
}

/** Display raw fields */
function displayRawFields() {
  if (NEW_ITEM_SOURCE.value === "raw") {
    NEW_ITEM_RAWCONTENT_DISPLAY.classList.remove("hidden");
  } else {
    NEW_ITEM_RAWCONTENT_DISPLAY.classList.add("hidden");
  }
}

// <div
//   data-item-id="{{project_id}}"
//   data-item-name="{{project_name}}"
//   data-item-versions="{{applied_versions}}"
//   data-item-source="{{project_source}}"
//   class="flex flex-row shrink-0 p-2 h-16 lg:h-20 hover:bg-slate-50 transition-all cursor-pointer"
//   onclick="changeDisplayItem('{{project_id}}');"
// >
//   <img class="h-full rounded-md" src="/api/v1/icons/temp" alt="Icon" />
//   <div class="hidden lg:flex flex-col justify-between lg:ml-2">
//     <span class="text-sm font-bold">{{project_name}}</span>
//     <span class="text-xs font-mono">{{applied_versions}}</span>
//     <span class="text-xs">{{project_source}}</span>
//   </div>
// </div>

/** Create a new element in the item list. */
function createNewItemInMenu(
  project_id,
  project_name,
  applied_versions,
  project_source,
  content = null
) {
  // Parent Item
  const parent_div = document.createElement("div");
  parent_div.dataset["itemId"] = project_id;
  parent_div.dataset["itemName"] = project_name;
  parent_div.dataset["itemVersions"] = applied_versions;
  parent_div.dataset["itemSource"] = project_source;
  if (content != null) parent_div.dataset["itemContent"] = content;
  parent_div.classList.add(
    "flex",
    "flex-row",
    "shrink-0",
    "p-2",
    "h-16",
    "lg:h-20",
    "hover:bg-slate-50",
    "transition-all",
    "cursor-pointer"
  );
  parent_div.addEventListener("click", () => {
    changeDisplayItem(project_id);
  });

  // Icon
  const icon = document.createElement("img");
  icon.src = "/api/v1/icons/temp";
  icon.alt = "Icon";
  icon.classList.add("h-full", "rounded-md");

  // Meta
  const meta = document.createElement("div");
  meta.classList.add(
    "hidden",
    "lg:flex",
    "flex-col",
    "justify-between",
    "lg:ml-2"
  );

  // Meta: Name
  const name = document.createElement("span");
  name.innerHTML = project_name;
  name.classList.add("text-sm", "font-bold");

  // Meta: Versions
  const versions = document.createElement("span");
  versions.innerHTML = applied_versions;
  versions.classList.add("text-xs", "font-mono");

  // Meta: Source
  const source = document.createElement("span");
  source.innerHTML = project_source;
  source.classList.add("text-xs");

  // Link Things Together
  meta.appendChild(name);
  meta.appendChild(versions);
  meta.appendChild(source);

  parent_div.appendChild(icon);
  parent_div.appendChild(meta);

  // Deploy to the list.
  ITEM_LIST.appendChild(parent_div);

  return parent_div;
}

function addNewItem() {
  const project_id = NEW_ITEM_ID.value;
  const project_source = NEW_ITEM_SOURCE.value;
}

// RUN ON LOAD
loadResourceInfo();

NEW_ITEM_SOURCE.addEventListener("change", displayRawFields);
displayRawFields();

NEW_ITEM_VERSIONS.addEventListener("input", () => {
  NEW_ITEM_DISPLAY_VERSIONS.innerHTML =
    NEW_ITEM_VERSIONS.value.trim() == ""
      ? "[No versions specified, this will be included in ALL versions.]"
      : NEW_ITEM_VERSIONS.value.replaceAll(" ", "").split(",").join(", ");
});
