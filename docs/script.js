// ===== Pulse Documentation - Minimal JS =====

(function () {
  'use strict';

  // ===== Syntax Highlighting =====
  function highlightCode(el) {
    let code = el.textContent;
    const lang = el.closest('.code-block')?.dataset.lang || 'typescript';

    if (lang === 'bash') {
      // Bash: highlight comments, strings, commands
      code = code
        .replace(/(#[^\n]*)/g, '<span class="syn-cm">$1</span>')
        .replace(/('(?:[^'\\]|\\.)*')/g, '<span class="syn-str">$1</span>')
        .replace(/(npm|npx|yarn|pnpm|bash|cd|mkdir|ls|cat)\b/g, '<span class="syn-fn">$1</span>')
        .replace(/(install|run|build|test|start)\b/g, '<span class="syn-kw">$1</span>');
      el.innerHTML = code;
      return;
    }

    if (lang === 'hbs') {
      // Handlebars: minimal highlighting
      code = code
        .replace(/(\{\{[^}]*\}\})/g, '<span class="syn-fn">$1</span>')
        .replace(/(&lt;[^&]*&gt;)/g, '<span class="syn-tag">$1</span>');
      el.innerHTML = code;
      return;
    }

    // TypeScript / TSX highlighting

    // Temporarily replace strings and comments to avoid double-highlighting
    const stash = [];
    function stashItem(match) {
      stash.push(match);
      return '\x00STASH' + (stash.length - 1) + '\x00';
    }

    // Stash template literals
    code = code.replace(/`(?:[^`\\]|\\.)*`/g, stashItem);
    // Stash double-quoted strings
    code = code.replace(/"(?:[^"\\]|\\.)*"/g, stashItem);
    // Stash single-quoted strings
    code = code.replace(/'(?:[^'\\]|\\.)*'/g, stashItem);
    // Stash multi-line comments
    code = code.replace(/\/\*[\s\S]*?\*\//g, stashItem);
    // Stash single-line comments
    code = code.replace(/\/\/[^\n]*/g, stashItem);

    // Decorators
    code = code.replace(/@(\w+)/g, '<span class="syn-dec">@$1</span>');

    // Keywords
    code = code.replace(
      /\b(const|let|var|function|return|import|from|export|default|if|else|new|class|interface|type|extends|implements|async|await|for|of|in|while|do|switch|case|break|continue|throw|try|catch|finally|typeof|instanceof|void|null|undefined|true|false|this|super|static|readonly|private|public|protected|abstract|enum|namespace|declare|module|as|is|keyof|never|unknown|any|string|number|boolean|bigint|symbol|object|Promise)\b/g,
      '<span class="syn-kw">$1</span>'
    );

    // Types (PascalCase words that look like types)
    code = code.replace(
      /\b(Engine|EngineOptions|EventType|Signal|TweenValue|TweenConfig|SpringValue|SpringConfig|FrameData|Rule|Mailbox|DAGGraph|Middleware|AsyncConfig|AsyncContext|AsyncStrategy|RecordedEvent|EngineSnapshot|DevToolsOptions|PulseService|TrackedSignal|TrackedTween|TrackedSpring|WritableSignal|Accessor|Ref|InjectionKey|InjectionToken|Component|DestroyRef|HTMLElement|Map|Set|Error|AbortSignal)\b/g,
      '<span class="syn-type">$1</span>'
    );

    // Numbers
    code = code.replace(/\b(\d+\.?\d*)\b/g, '<span class="syn-num">$1</span>');

    // Function calls (word followed by open paren)
    code = code.replace(
      /\b([a-z]\w*)\s*(?=\()/g,
      '<span class="syn-fn">$1</span>'
    );

    // JSX tags (simplified)
    code = code.replace(/(&lt;\/?[A-Z]\w*)/g, '<span class="syn-tag">$1</span>');

    // Restore stashed items with appropriate highlighting
    code = code.replace(/\x00STASH(\d+)\x00/g, function (_, idx) {
      var item = stash[parseInt(idx, 10)];
      if (item.startsWith('//') || item.startsWith('/*')) {
        return '<span class="syn-cm">' + item + '</span>';
      }
      return '<span class="syn-str">' + item + '</span>';
    });

    el.innerHTML = code;
  }

  // ===== Copy to Clipboard =====
  function setupCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var codeBlock = btn.closest('.code-block');
        var code = codeBlock.querySelector('pre code');
        var text = code.textContent;

        navigator.clipboard.writeText(text).then(function () {
          btn.textContent = 'Copied!';
          btn.classList.add('copied');
          setTimeout(function () {
            btn.textContent = 'Copy';
            btn.classList.remove('copied');
          }, 2000);
        }).catch(function () {
          // Fallback for older browsers
          var textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          btn.textContent = 'Copied!';
          btn.classList.add('copied');
          setTimeout(function () {
            btn.textContent = 'Copy';
            btn.classList.remove('copied');
          }, 2000);
        });
      });
    });
  }

  // ===== Active Sidebar Section (Intersection Observer) =====
  function setupScrollSpy() {
    var sections = document.querySelectorAll('.doc-section[id]');
    var navLinks = document.querySelectorAll('.sidebar-nav .nav-link');

    if (!sections.length || !navLinks.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.id;
            navLinks.forEach(function (link) {
              link.classList.remove('active');
              if (link.getAttribute('href') === '#' + id) {
                link.classList.add('active');
              }
            });
          }
        });
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  // ===== Mobile Hamburger Menu =====
  function setupHamburger() {
    var hamburger = document.querySelector('.hamburger');
    var sidebar = document.querySelector('.sidebar');
    var overlay = document.querySelector('.sidebar-overlay');

    if (!hamburger) return;

    function toggleMenu() {
      hamburger.classList.toggle('active');
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    }

    function closeMenu() {
      hamburger.classList.remove('active');
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    }

    hamburger.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', closeMenu);

    // Close on nav link click (mobile)
    sidebar.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.innerWidth <= 768) {
          closeMenu();
        }
      });
    });
  }

  // ===== Sidebar Search =====
  function setupSearch() {
    var searchInput = document.querySelector('.sidebar-search input');
    var navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    var navSections = document.querySelectorAll('.sidebar-nav .nav-section');

    if (!searchInput) return;

    searchInput.addEventListener('input', function () {
      var query = searchInput.value.toLowerCase().trim();

      if (!query) {
        navLinks.forEach(function (link) {
          link.style.display = '';
        });
        navSections.forEach(function (section) {
          section.style.display = '';
          section.classList.remove('collapsed');
        });
        return;
      }

      navSections.forEach(function (section) {
        var title = section.querySelector('.nav-section-title');
        var links = section.querySelectorAll('.nav-link');
        var anyVisible = false;

        var titleText = title ? title.textContent.toLowerCase() : '';
        if (titleText.includes(query)) {
          anyVisible = true;
          links.forEach(function (link) {
            link.style.display = '';
          });
        } else {
          links.forEach(function (link) {
            var text = link.textContent.toLowerCase();
            if (text.includes(query)) {
              link.style.display = '';
              anyVisible = true;
            } else {
              link.style.display = 'none';
            }
          });
        }

        section.style.display = anyVisible ? '' : 'none';
        if (anyVisible) {
          section.classList.remove('collapsed');
        }
      });
    });
  }

  // ===== Collapsible Sidebar Sections =====
  function setupCollapsible() {
    document.querySelectorAll('.nav-section-title').forEach(function (title) {
      title.addEventListener('click', function () {
        var section = title.closest('.nav-section');
        section.classList.toggle('collapsed');
      });
    });
  }

  // ===== Framework Tabs =====
  function setupTabs() {
    document.querySelectorAll('.framework-tabs').forEach(function (tabGroup) {
      var buttons = tabGroup.querySelectorAll('.tab-btn');
      var panels = tabGroup.querySelectorAll('.tab-panel');

      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var target = btn.dataset.tab;

          buttons.forEach(function (b) { b.classList.remove('active'); });
          panels.forEach(function (p) { p.classList.remove('active'); });

          btn.classList.add('active');
          var panel = tabGroup.querySelector('.tab-panel[data-tab="' + target + '"]');
          if (panel) panel.classList.add('active');
        });
      });
    });
  }

  // ===== Initialize =====
  function init() {
    // Syntax highlight all code blocks
    document.querySelectorAll('.code-block pre code').forEach(highlightCode);

    setupCopyButtons();
    setupScrollSpy();
    setupHamburger();
    setupSearch();
    setupCollapsible();
    setupTabs();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
