/** @typedef {"raw" | "modrinth"} ItemSource The source of an item. */
/** @typedef {{project_id: string, project_name: string, project_author: string, project_source: ItemSource, applied_versions: string[], raw_content?: string}} Item An item in the editor. */
/** @typedef {{project_id: string, project_name: string, project_author: string, project_source: string, applied_versions: string, raw_content?: string}} RenderableItem An item in the editor that is pretty. */
/** @typedef {(error: Error | null, content?: Item) => void} FetchResourceCallback The callback run when a resource is fetched. */

/** An Editor for the Items */
class Editor {
  /** The element the editor is attached to. @type {HTMLElement} */
  editorElement;

  /** If the editor should print debug logs. */
  verbose;

  /** The current user who is using the editor. @type {string} */
  currentUser;

  /** The items that are currently in the editor. @type {Map<string, Item>} */
  items = new Map();

  /** The current item being displayed. @type {string | null} */
  currentItem = null;

  /**
   * @param {HTMLElement | string} attachTo The element to attach editor functions to.
   * @param {boolean} verbose If the editor should print out debug logs.
   */
  constructor(attachTo, verbose = false) {
    this.editorElement =
      typeof attachTo === "string"
        ? document.querySelector(attachTo)
        : attachTo;

    this.verbose = verbose;

    this.currentUser = this.editorElement.dataset["user"];

    // Attach listeners
    document
      .getElementById("new_item_btn")
      .addEventListener("click", this.handleNewItemPopup(true));
    document
      .getElementById("close_new_item")
      .addEventListener("click", this.handleNewItemPopup(false));
    document
      .getElementById("new_item_source_input")
      .addEventListener("change", this.handleNewItemRawFieldToggle());
    document
      .getElementById("new_item_preview_btn")
      .addEventListener("click", this.handleSeeNewItemPreview());
    document
      .getElementById("add_item_btn")
      .addEventListener("click", this.handleCreateNewItem());
    document
      .getElementById("visible_remove_btn")
      .addEventListener("click", this.handleRemoveItem());

    // Load data into editor.
    const jsonItems = JSON.parse(this.editorElement.dataset["items"]);
    this.setItems(...jsonItems).then(() => {
      this.setCurrentItem(this.items.keys().toArray()[0]); // Load first loaded item.
      console.info("Done");
    });
  }

  // Functionallity

  /**
   * Cleans a new item to contain all required data.
   * @param {Item} item An item that may have partial data.
   * @param {(error: Error | null, item?: Item) => void} callback The cleaned item.
   */
  cleanNewItemData(item, callback) {
    if (item.project_source == null) throw new Error("No source specified.");

    const DEFAULT_ITEM = {
      project_id: null,
      project_name: "Unknown",
      project_author: `Server [${this.currentUser}]`,
      applied_versions: [],
      raw_content: null,
    };

    item = { ...DEFAULT_ITEM, ...item };

    /** Generate a UUID. Bad implementation but whatev. */
    function uuidv4() {
      return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (
          +c ^
          (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
        ).toString(16)
      );
    }

    if (item.project_source === "raw") {
      item.project_id = item.project_id ?? uuidv4();
      callback(null, item);
    } else if (item.project_source === "modrinth") {
      callback(null, item);
    } else {
      callback(new Error("Don't know how to add this item."));
    }
  }

  /** Convert the editor data to JSON. */
  JSONify() {
    let out = [];
    for (let [_id, item] of this.items) {
      out.push(item);
    }
    return JSON.stringify(out);
  }

  /**
   * Adds items to the item list.
   * @param {Item[]} items The content to add.
   * @returns {Promise<void>} A promise that resolves all items are added.
   */
  setItems(...items) {
    return new Promise((resolve, reject) => {
      if (items.length === 0) {
        this.render();
        resolve();
      }

      let done = 0;

      for (let item of items) {
        this.cleanNewItemData(item, (error, item) => {
          if (error == null) {
            this.fetchFromResource(
              item.project_source,
              item.project_id,
              {
                applied_versions: item.applied_versions,
                raw_content: item.raw_content,
              },
              item,
              (error, item) => {
                if (error == null) {
                  this.items.set(item.project_id, item);

                  done++;

                  if (done === items.length) {
                    this.editorElement.dataset["items"] = this.JSONify();
                    this.render();
                    resolve();
                  }
                } else {
                  reject(error);
                }
              }
            );
          } else {
            reject(error);
          }
        });
      }
    });
  }

  /**
   * Removes an item from the item list.
   * @param {string[]} ids The id of the item.
   * @returns {Promise<void>} A promise that resolves when all items are deleted.
   */
  removeItems(...ids) {
    return new Promise((resolve, reject) => {
      if (ids.length === 0) {
        this.render();
        resolve();
      }

      let done = 0;

      for (let id of ids) {
        this.items.delete(id);
        done++;

        if (done === ids.length) {
          this.render();
          resolve();
        }
      }
    });
  }

  /**
   * Sets the current item to be that of the id provided.
   * @param {string} id The item id.
   */
  setCurrentItem(id) {
    if (this.items.has(id) || id == null) {
      if (this.currentItem != id) {
        console.info(`Changing display to ${id}...`);

        this.currentItem = id;

        this.render();
      }
    } else {
      throw new Error("Not a valid item.");
    }
  }

  // Rendering

  /**
   * Cleans up an item for rendering.
   * @param {Item} item The item to clean up.
   * @returns {RenderableItem} An item-type object that is pretty.
   */
  renderPrettifyItem(item) {
    const SOURCE_NAMES = {
      modrinth: "Modrinth",
      raw: "Local File",
    };

    return {
      project_id: item.project_id,
      project_name: item.project_name,
      project_author: item.project_author,
      project_source: SOURCE_NAMES[item.project_source],
      applied_versions:
        item.applied_versions.length > 0
          ? item.applied_versions.join(", ")
          : "All Versions",
      raw_content: item.raw_content,
    };
  }

  /** Render the item list to the DOM. */
  renderItemList() {
    const self = this;

    /**
     * Generates a new item list element.
     * @param {RenderableItem} item The content to put in the element.
     */
    function generateNewItemListElement(item) {
      // Parent Div
      const root = document.createElement("div");
      root.classList.add(
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

      root.addEventListener(
        "click",
        self.handleChangeDisplayClick(item.project_id)
      );

      // Icon
      const icon = document.createElement("img");
      icon.src = "/api/v1/icons/temp";
      icon.alt = "Resource Icon";
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

      // Meta: Name + Author
      const info = document.createElement("span");
      info.classList.add("flex", "flex-row", "items-center");

      const name = document.createElement("span");
      name.innerHTML = item.project_name;

      const nameSize = item.project_name.length > 16 ? "text-xs" : "text-sm";

      name.classList.add(nameSize, "font-bold", "object-scale-down");

      const author = document.createElement("span");
      author.innerHTML = item.project_author;
      author.classList.add("text-xs", "ml-2");

      // Meta: Versions
      const versions = document.createElement("span");
      versions.innerHTML = item.applied_versions;
      versions.classList.add("text-xs", "font-mono");

      // Meta: Source
      const source = document.createElement("span");
      source.innerHTML = item.project_source;
      source.classList.add("text-xs");

      // Link Things Together
      info.appendChild(name);
      info.appendChild(author);

      meta.appendChild(info);
      meta.appendChild(versions);
      meta.appendChild(source);

      root.appendChild(icon);
      root.appendChild(meta);

      // Return elements
      return { root, icon, name, author, versions, source };
    }

    const itemList = document.getElementById("item_list");
    const noItemIndicator = document.getElementById("no_items_indicator");

    itemList.innerHTML = "";

    if (this.items.size <= 0) {
      noItemIndicator.classList.remove("hidden");
      return;
    } else {
      noItemIndicator.classList.add("hidden");
    }

    for (const [id, item] of this.items) {
      if (this.verbose) console.debug(`Rendering list item ${id}...`);

      const { root, icon } = generateNewItemListElement(
        this.renderPrettifyItem(item)
      );

      itemList.appendChild(root);

      this.fetchIconFromResource(item.project_source, id, (error, src) => {
        if (error == null) {
          icon.src = src;
        }
      });
    }
  }

  /** Render the currently displayed item to DOM. */
  renderDisplayedItem() {
    /**
     * Encapsulate text in a codeblock.
     * @param {string} text The text to encapsulate.
     */
    function encapsulateInTextarea(text) {
      const textarea = document.createElement("textarea");
      textarea.cols = text.split("\n").length;
      textarea.classList.add(
        "input-text",
        "text-xs",
        "resize-none",
        "w-full",
        "min-h-24",
        "hover:no-underline"
      );
      textarea.innerHTML = text;
      textarea.id = "visible_raw_data";
      return textarea;
    }
    /**
     * Encapsulate text in a span.
     * @param {string} text The text to encapsulate.
     */
    function encapsulateInNothing(text) {
      const root = document.createElement("div");

      const ta = document.createElement("textarea");
      ta.classList.add("hidden");
      ta.id = "visible_raw_data";

      const span = document.createElement("span");
      span.innerHTML = text;

      root.appendChild(ta);
      root.appendChild(span);

      return root;
    }

    if (this.verbose) console.debug("Rendering visible item...");

    const visibleDisplay = document.getElementById("visible_display");

    const displayIcon = document.getElementById("visible_icon");
    const displayName = document.getElementById("visible_name");
    const displayAuthor = document.getElementById("visible_author");
    const displayRawContent = document.getElementById("visible_description");
    const displayVersions = document.getElementById("visible_versions");

    if (this.currentItem != null) {
      visibleDisplay.classList.remove("hidden");

      const rawItem = this.items.get(this.currentItem);
      const item = this.renderPrettifyItem(rawItem);

      displayName.innerHTML = item.project_name;
      displayAuthor.innerHTML = item.project_author;
      displayVersions.value =
        rawItem.applied_versions.length > 0 ? item.applied_versions : "";

      displayRawContent.innerHTML = "";
      displayRawContent.appendChild(
        rawItem.project_source === "raw"
          ? encapsulateInTextarea(item.raw_content ?? "No Content")
          : encapsulateInNothing(item.raw_content ?? "No Description")
      );

      this.fetchIconFromResource(
        rawItem.project_source,
        rawItem.project_id,
        (error, src) => {
          if (error == null) {
            displayIcon.src = src;
          }
        }
      );
    } else {
      visibleDisplay.classList.add("hidden");
    }
  }

  /** Render the item count. */
  renderItemCount() {
    if (this.verbose) console.debug("Rendering item count...");
    const itemCounter = document.getElementById("existing_count");
    itemCounter.innerHTML = this.items.size;
  }

  /** Render the editor to the DOM. */
  render() {
    this.renderItemList();
    this.renderDisplayedItem();
    this.renderItemCount();
  }

  // Fetch

  /**
   * Verify that a request contains the reqired data.
   * @param {string} project_id The project id.
   * @param {(valid: boolean, reason?: string) => void} callback A callback that returns if the request is valid.
   */
  verifyFetch(project_id, callback) {
    if (project_id.trim() === "") {
      callback(false, "Project id required.");
    } else {
      callback(true);
    }
  }

  /**
   * Fetch data locally, stored in editor.
   * @param {string} id The project id.
   * @param {Item} overrides Data to override locally. This needs to contain most of the data.
   * @param {Item} base Data to set as the base item. Will be overrid by loaded data.
   * @param {FetchResourceCallback} callback The callback to run.
   */
  fetchFromRaw(id, overrides, base, callback) {
    callback(null, {
      project_id: id,
      project_name: overrides.project_name ?? base.project_name,
      project_author: overrides.project_author ?? base.project_author,
      project_source: "raw",
      applied_versions: overrides.applied_versions ?? base.applied_versions,
      raw_content: overrides.raw_content ?? base.raw_content,
    });
  }

  /**
   * Fetch data from Modrinth using the ModrinthAPI.
   * @param {string} id The project id.
   * @param {Item} overrides Data to override.
   * @param {Item} base Data to set as the base item. Will be overrid by loaded data.
   * @param {FetchResourceCallback} callback The callback to run.
   */
  fetchFromModrinth(id, overrides, base, callback) {
    Promise.all([MODRINTH_API.project(id), MODRINTH_API.authors(id)])
      .then(([content, authors]) => {
        let modrinthAuthor;
        for (let author of authors) {
          if (author.role === "Owner" || author.role === "Author") {
            // Ensure the correct user is placed here.
            modrinthAuthor = author.user.username;
            break;
          }
        }

        callback(null, {
          project_id: id,
          project_name: overrides.project_name ?? content.title,
          project_author: overrides.project_author ?? modrinthAuthor,
          project_source: "modrinth",
          applied_versions: overrides.applied_versions,
          raw_content: overrides.raw_content ?? content.description,
        });
      })
      .catch((error) => {
        callback(error);
      });
  }

  /**
   * Fetch data from a resource, such as Modrinth.
   * @param {ItemSource} source The place to get the data.
   * @param {string} id The id of the project we need data from.
   * @param {Item} overrides Override response data with this data.
   * @param {Item} base Data to set as the base item. Will be overrid by loaded data.
   * @param {FetchResourceCallback} callback The callback to run once data is fetched.
   */
  fetchFromResource(
    source,
    id,
    overrides = {},
    base = {},
    callback = () => {}
  ) {
    this.verifyFetch(id, (valid, reason) => {
      if (valid) {
        if (source === "raw") {
          this.fetchFromRaw(id, overrides, base, callback);
        } else if (source === "modrinth") {
          this.fetchFromModrinth(id, overrides, base, callback);
        } else {
          callback(new Error("Dont know how to fetch this resource."));
        }
      } else {
        callback(new Error(`Invalid data: ${reason}`));
      }
    });
  }

  /**
   * Gets an icon url from Modrinth.
   * @param {string} id The project id.
   * @param {FetchResourceCallback} callback A callback containing the icon url.
   */
  fetchIconFromModrinth(id, callback) {
    MODRINTH_API.project(id)
      .then((content) => {
        callback(null, content.icon_url);
      })
      .catch((error) => {
        callback(error);
      });
  }

  /**
   * Gets an icon url from a resource.
   * @param {ItemSource} source The source to get the icon from.
   * @param {string} id The project id.
   * @param {FetchResourceCallback} callback A callback containing the icon url.
   */
  fetchIconFromResource(source, id, callback) {
    if (source === "raw") {
      callback(null, "/api/v1/icons/temp"); // This one is very simple.
    } else if (source === "modrinth") {
      this.fetchIconFromModrinth(id, callback);
    } else {
      callback(new Error("Dont know how to fetch this resource."));
    }
  }

  // Handlers

  /**
   * Create handler changing the display when an item is clicked.
   * @param {string} id The project id.
   * @returns {(event: MouseEvent) => void} An event handler for a "click" event.
   */
  handleChangeDisplayClick(id) {
    return () => {
      this.setCurrentItem(id);
    };
  }

  /**
   * Handle the New Item Popup.
   * @param {boolean} show If the menu should be shown or hidden.
   * @returns {(event: MouseEvent) => void} An event handler for a "click" event.
   */
  handleNewItemPopup(show) {
    return () => {
      const popup = document.getElementById("new_item_popup");

      document.getElementById("new_item_id_input").value = "";
      document.getElementById("new_item_source_input").value = "modrinth";
      document.getElementById("new_item_vers_input").value = "";
      document.getElementById("new_item_name_input").value = "";
      document.getElementById("new_item_rawcontent_input").value = "";

      document
        .getElementById("new_item_rawcontent_disp")
        .classList.add("hidden");

      document.getElementById("new_item_indicator").classList.add("hidden");

      document.getElementById("add_item_btn").disabled = true;

      popup.classList[show ? "remove" : "add"]("hidden");
    };
  }

  /**
   * Handle enabling raw data fields when switching data.
   * @returns {(event: InputEvent) => void} An event handler for a "change" event.
   */
  handleNewItemRawFieldToggle() {
    return () => {
      document
        .getElementById("new_item_rawcontent_disp")
        .classList[
          document.getElementById("new_item_source_input").value === "raw"
            ? "remove"
            : "add"
        ]("hidden");
    };
  }

  /**
   * Handle generating the preview.
   * @returns {(event: MouseEvent) => void} An event handler for a "click" event.
   */
  handleSeeNewItemPreview() {
    /** Print out a message. */
    function sayMessage(text) {
      const newItemIndicator = document.getElementById("new_item_indicator");
      if (text == null || text === "") {
        newItemIndicator.classList.add("hidden");
      } else {
        newItemIndicator.innerHTML = text;
        newItemIndicator.classList.remove("hidden");
      }
    }

    return () => {
      const newIdValue = document.getElementById("new_item_id_input");

      const newNameValue = document
        .getElementById("new_item_name_input")
        .value.trim();
      const newRawCValue = document
        .getElementById("new_item_rawcontent_input")
        .value.trim();

      const newVersValue = document
        .getElementById("new_item_vers_input")
        .value.trim()
        .replaceAll(" ", "");

      const newSourceValue = document.getElementById(
        "new_item_source_input"
      ).value;

      if (newIdValue.value.trim() === "" && newSourceValue !== "raw") {
        document.getElementById("add_item_btn").disabled = true;
        sayMessage("ID is required if not local resource.");
        return;
      }

      const baseItem = {
        project_id:
          newIdValue.value.trim() === "" ? null : newIdValue.value.trim(),
        project_name:
          newNameValue.trim() === "" ? "Unknown" : newNameValue.trim(),
        project_author: `Server [${this.currentUser}]`,
        project_source: newSourceValue,
        applied_versions: newVersValue === "" ? [] : newVersValue.split(","),
        raw_content: newRawCValue === "" ? "No Content" : newRawCValue,
      };

      this.cleanNewItemData(baseItem, (error, item) => {
        if (error == null) {
          this.fetchFromResource(
            item.project_source,
            item.project_id,
            { applied_versions: item.applied_versions },
            item,
            (error, cleanedItem) => {
              if (error == null) {
                this.fetchIconFromResource(
                  item.project_source,
                  item.project_id,
                  (error, src) => {
                    if (error != null) {
                      sayMessage(
                        `Couldn't load icon for project ${item.project_id} from ${item.project_source}.`
                      );
                      console.warn(error);
                    } else {
                      sayMessage();
                    }

                    newIdValue.value = cleanedItem.project_id;

                    const prettyItem = this.renderPrettifyItem(cleanedItem);

                    document.getElementById("new_item_icon").src = src;
                    document.getElementById("new_item_name").innerHTML =
                      prettyItem.project_name;
                    document.getElementById("new_item_author").innerHTML =
                      prettyItem.project_author;
                    document.getElementById("new_item_versions").innerHTML =
                      prettyItem.applied_versions;
                    document.getElementById("new_item_source").innerHTML =
                      prettyItem.project_source;

                    document.getElementById("add_item_btn").disabled = false;
                  }
                );
              } else {
                document.getElementById("add_item_btn").disabled = true;
                sayMessage(
                  `Couldn't fetch project ${item.project_id} from ${item.project_source}.`
                );
                console.error(error);
              }
            }
          );
        } else {
          document.getElementById("add_item_btn").disabled = true;
          sayMessage(`Unknown error. Contact the webmaster.`);
          console.error(error);
        }
      });
    };
  }

  /**
   * Handle creating a new item.
   * @returns {(event: MouseEvent) => void} An event handler for a "click" event.
   */
  handleCreateNewItem() {
    return () => {
      const newIdValue = document.getElementById("new_item_id_input");

      const newNameValue = document
        .getElementById("new_item_name_input")
        .value.trim();
      const newRawCValue = document
        .getElementById("new_item_rawcontent_input")
        .value.trim();

      const newVersValue = document
        .getElementById("new_item_vers_input")
        .value.trim()
        .replaceAll(" ", "");

      const newSourceValue = document.getElementById(
        "new_item_source_input"
      ).value;

      const baseItem = {
        project_id:
          newIdValue.value.trim() === "" ? null : newIdValue.value.trim(),
        project_name:
          newNameValue.trim() === "" ? "Unknown" : newNameValue.trim(),
        project_author: `Server [${this.currentUser}]`,
        project_source: newSourceValue,
        applied_versions: newVersValue === "" ? [] : newVersValue.split(","),
        raw_content: newRawCValue === "" ? "No Content" : newRawCValue,
      };

      this.cleanNewItemData(baseItem, (error, item) => {
        if (error == null) {
          this.fetchFromResource(
            item.project_source,
            item.project_id,
            { applied_versions: item.applied_versions },
            item,
            (error, cleanedItem) => {
              if (error == null) {
                this.setItems(cleanedItem);
                this.handleNewItemPopup(false)();
              } else {
                console.error(error);
              }
            }
          );
        } else {
          console.error(error);
        }
      });
    };
  }

  /**
   * Handle removing an item.
   * @returns {(event: MouseEvent) => void} An event handler for a "click" event.
   */
  handleRemoveItem() {
    return () => {
      if (this.currentItem != null) {
        const currentItem = this.currentItem;
        this.setCurrentItem(null);
        this.removeItems(currentItem);
      }
    };
  }
}

// On Load

const editor = new Editor("#editor");
