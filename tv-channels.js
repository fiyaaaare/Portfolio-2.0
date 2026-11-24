const TVChannels = (() => {
  function createStaticNoise() {
    const chars = ".:+*#%@~=-/\\";
    let output = "";
    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 42; col++) {
        output += chars[Math.floor(Math.random() * chars.length)];
      }
      output += "\n";
    }
    return output;
  }

  function formatTwoDigits(num) {
    return String(num).padStart(2, "0");
  }

  function mount(selector, projects = []) {
    const root = document.querySelector(selector);
    if (!root || !Array.isArray(projects) || projects.length === 0) return;

    let currentIndex = 0;
    let isPoweredOn = true;
    let staticTimer = null;

    const first = projects[0];

    root.innerHTML = `
      <div class="ascii-tv-widget" role="region" aria-label="ASCII Retro Television Showcase">
        <pre class="tv-top-antenna" aria-hidden="true">          \\     /          
           \\   /           
            \\ /            
             X             
             |             </pre>

        <div class="tv-outer-glow-frame">
          <div class="tv-inner-ascii-box">
            <div class="tv-top-ticks" aria-hidden="true">
              <span>||||||||||||||||||</span>
              <span>====================</span>
              <span>||||||||||||||||||</span>
            </div>

            <div class="tv-main-split">
              <!-- Left: Curved CRT Screen -->
              <div class="tv-crt-bezel">
                <div class="tv-crt-glass">
                  <div class="tv-crt-hud-top">
                    <span id="tv-fps-status">60 FPS // BUFFER_OK</span>
                    <span id="tv-screen-project">PROJECT 01 / ${formatTwoDigits(projects.length)}</span>
                  </div>

                  <div class="tv-screen-stage">
                    <video
                      id="tv-project-video"
                      class="tv-project-video"
                      autoplay
                      loop
                      muted
                      playsinline
                      preload="metadata"
                      hidden
                    ></video>
                    <div id="tv-screen-placeholder" class="tv-screen-placeholder">[ ADD VIDEO SOURCE ]</div>
                    <pre class="tv-static-screen" id="tv-static-screen" aria-hidden="true"></pre>
                    <div class="tv-scanlines-overlay" aria-hidden="true"></div>
                    <div class="tv-grain-overlay" aria-hidden="true"></div>
                    <div class="tv-crt-curve-shadow" aria-hidden="true"></div>
                    <div class="tv-off-overlay" id="tv-off-overlay" aria-hidden="true">
                      <span>[ PWR: OFF ]</span>
                    </div>
                  </div>

                  <div class="tv-crt-hud-bottom">
                    <span id="tv-playing-label">&lt;&lt; PLAYING DEMO &gt;&gt;</span>
                    <span class="tv-bottom-dashes" aria-hidden="true">============</span>
                  </div>
                </div>
              </div>

              <!-- Vertical ASCII Divider -->
              <pre class="tv-mid-divider" aria-hidden="true">||
||
||
||
||
||
||
||
||
||
||
||
||
||</pre>

              <!-- Right: Tuning, Prev/Next, Power -->
              <div class="tv-side-deck">
                <div class="tv-control-group">
                  <div class="tv-tuning-section" aria-hidden="true">
                    <div class="tv-section-tag">[ TUNING ]</div>
                    <span class="tv-tuning-dial"></span>
                  </div>

                  <div class="tv-step-row">
                    <button type="button" class="tv-action-btn" id="tv-prev-project" aria-label="Previous project">
                      [ PREV ]
                    </button>
                    <button type="button" class="tv-action-btn" id="tv-next-project" aria-label="Next project">
                      [ NEXT ]
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  class="tv-pwr-btn"
                  id="tv-pwr-toggle"
                  aria-pressed="true"
                  aria-label="Toggle TV Power"
                >
                  <span class="tv-pwr-star" id="tv-pwr-star">*</span>
                  <span id="tv-pwr-label">[ PWR: ON ]</span>
                </button>
              </div>
            </div>

            <div class="tv-bottom-ticks" aria-hidden="true">
              <span>||||||||||||||||||</span>
              <span>====================</span>
              <span>||||||||||||||||||</span>
            </div>
          </div>
        </div>

        <pre class="tv-base-stand" aria-hidden="true">  \\:::::::::::::::::::::::::::::::/
   L=============================J</pre>
      </div>
    `;

    const videoEl = root.querySelector("#tv-project-video");
    const screenPlaceholderEl = root.querySelector("#tv-screen-placeholder");
    const staticEl = root.querySelector("#tv-static-screen");
    const screenProjectEl = root.querySelector("#tv-screen-project");
    const playingLabelEl = root.querySelector("#tv-playing-label");
    const offOverlayEl = root.querySelector("#tv-off-overlay");
    const prevBtn = root.querySelector("#tv-prev-project");
    const nextBtn = root.querySelector("#tv-next-project");
    const pwrBtn = root.querySelector("#tv-pwr-toggle");
    const pwrStarEl = root.querySelector("#tv-pwr-star");
    const pwrLabelEl = root.querySelector("#tv-pwr-label");

    // Left column text targets in index.html
    const indexEl = document.getElementById("proj-index");
    const titleEl = document.getElementById("proj-title");
    const descEl = document.getElementById("proj-desc");
    const tagsEl = document.getElementById("proj-tags");
    const linkEl = document.getElementById("proj-link");

    function playStaticBurst() {
      if (staticTimer) clearTimeout(staticTimer);
      staticEl.textContent = createStaticNoise();
      staticEl.classList.add("is-active");
      staticTimer = setTimeout(() => {
        staticEl.classList.remove("is-active");
      }, 240);
    }

    function updateProjectInfo(project, idx) {
      if (indexEl) {
        indexEl.textContent = `${formatTwoDigits(idx + 1)} / ${formatTwoDigits(projects.length)}`;
      }
      if (titleEl) titleEl.textContent = project.title;
      if (descEl) descEl.textContent = project.description;
      if (tagsEl && Array.isArray(project.tags)) {
        tagsEl.innerHTML = project.tags
          .map((tag) => `<span>${tag}</span>`)
          .join("");
      }
      if (linkEl && project.link) linkEl.href = project.link;
    }

    function showVideoError(project) {
      if (!isPoweredOn || projects[currentIndex] !== project) return;
      if (videoEl) videoEl.hidden = true;
      if (screenPlaceholderEl) {
        screenPlaceholderEl.hidden = false;
        screenPlaceholderEl.textContent = "[ VIDEO UNAVAILABLE ]";
      }
      if (playingLabelEl) playingLabelEl.textContent = "<< VIDEO UNAVAILABLE >>";
    }

    function updateScreen(project) {
      const hasVideo = typeof project.videoSrc === "string" && project.videoSrc.trim() !== "";

      if (videoEl) {
        if (hasVideo) {
          videoEl.hidden = false;
          if (videoEl.getAttribute("src") !== project.videoSrc) {
            videoEl.src = project.videoSrc;
            videoEl.load();
          }
          if (isPoweredOn) {
            videoEl.play().catch(() => showVideoError(project));
          } else {
            videoEl.pause();
          }
        } else {
          videoEl.pause();
          videoEl.removeAttribute("src");
          videoEl.load();
          videoEl.hidden = true;
        }
      }

      if (screenPlaceholderEl) {
        screenPlaceholderEl.hidden = hasVideo;
        screenPlaceholderEl.textContent = "[ ADD VIDEO SOURCE ]";
      }
      if (playingLabelEl) {
        playingLabelEl.textContent = !isPoweredOn
          ? "<< NO SIGNAL >>"
          : hasVideo
            ? "<< PLAYING DEMO >>"
            : "<< NO VIDEO LOADED >>";
      }
    }

    function setProject(nextIndex) {
      if (!isPoweredOn) return;

      currentIndex =
        ((nextIndex % projects.length) + projects.length) % projects.length;
      const project = projects[currentIndex];

      playStaticBurst();
      updateScreen(project);

      if (screenProjectEl) {
        screenProjectEl.textContent =
          `PROJECT ${formatTwoDigits(currentIndex + 1)} / ${formatTwoDigits(projects.length)}`;
      }

      updateProjectInfo(project, currentIndex);
    }

    function togglePower() {
      isPoweredOn = !isPoweredOn;
      root.classList.toggle("is-off", !isPoweredOn);

      if (offOverlayEl)
        offOverlayEl.classList.toggle("is-visible", !isPoweredOn);
      if (prevBtn) prevBtn.disabled = !isPoweredOn;
      if (nextBtn) nextBtn.disabled = !isPoweredOn;

      if (pwrBtn) pwrBtn.setAttribute("aria-pressed", String(isPoweredOn));
      if (pwrStarEl) pwrStarEl.textContent = isPoweredOn ? "*" : "o";
      if (pwrLabelEl)
        pwrLabelEl.textContent = isPoweredOn ? "[ PWR: ON ]" : "[ PWR: OFF ]";

      if (isPoweredOn) playStaticBurst();
      updateScreen(projects[currentIndex]);
    }

    prevBtn.addEventListener("click", () => setProject(currentIndex - 1));
    nextBtn.addEventListener("click", () => setProject(currentIndex + 1));
    pwrBtn.addEventListener("click", togglePower);

    videoEl.addEventListener("error", () => {
      const project = projects[currentIndex];
      if (project.videoSrc) showVideoError(project);
    });

    updateProjectInfo(first, 0);
    updateScreen(first);
  }

  return { mount };
})();
