(function () {
  "use strict";
  window.ProfConsultProfilePhotoActions = function ({ role, photo, input, uploadButton, removeButton, editButton, isEditing }) {
    let busy = false;
    let hasPhoto = false;

    function updateControls() {
      if (input) input.disabled = busy;
      if (uploadButton) {
        uploadButton.setAttribute("aria-disabled", String(busy));
        if (uploadButton.tagName === "BUTTON") uploadButton.disabled = busy;
      }
      if (removeButton) removeButton.disabled = busy || !hasPhoto;
      if (editButton) editButton.disabled = busy;
    }

    function sync(path) {
      hasPhoto = Boolean(path);
      if (photo) photo.src = path
        ? `${path}${path.includes("?") ? "&" : "?"}v=${Date.now()}`
        : "images/default-profile.jpg";
      updateControls();
    }

    async function save(file) {
      if (busy || !isEditing() || !photo || (!file && !hasPhoto)) return;
      busy = true;
      updateControls();
      const previousSrc = photo.src;
      const preview = file ? URL.createObjectURL(file) : null;
      if (preview) photo.src = preview;
      try {
        const body = new FormData();
        body.append("role", role);
        body.append("action", file ? "upload" : "remove");
        if (file) body.append("profile_photo", file);
        const response = await fetch("api/profile-photo.php", {
          method: "POST", credentials: "same-origin", headers: { Accept: "application/json" }, body,
        });
        const result = await response.json();
        if (!response.ok || !result.ok || typeof result.profile_photo !== "string") {
          throw new Error(result.message || "Unable to update profile photo.");
        }
        sync(result.profile_photo);
      } catch (error) {
        photo.src = previousSrc;
        window.alert(error.message || "Unable to update profile photo.");
      } finally {
        if (preview) URL.revokeObjectURL(preview);
        if (input) input.value = "";
        busy = false;
        updateControls();
      }
    }

    input?.addEventListener("change", () => {
      const file = input.files?.[0];
      if (file) save(file);
    });
    removeButton?.addEventListener("click", () => save(null));
    updateControls();
    return { sync };
  };
})();
