const LISTING_URL = "{{ listingInfo.Url }}";

const PACKAGES = {
{{~ for package in packages ~}}
  "{{ package.Name }}": {
    name: "{{ package.Name }}",
    displayName: "{{ if package.DisplayName; package.DisplayName; end; }}",
    description: "{{ if package.Description; package.Description; end; }}",
    version: "{{ package.Version }}",
    author: {
      name: "{{ if package.Author.Name; package.Author.Name; end; }}",
      url: "{{ if package.Author.Url; package.Author.Url; end; }}",
    },
    dependencies: {
      {{~ for dependency in package.Dependencies ~}}
        "{{ dependency.Name }}": "{{ dependency.Version }}",
      {{~ end ~}}
    },
    keywords: [
      {{~ for keyword in package.Keywords ~}}
        "{{ keyword }}",
      {{~ end ~}}
    ],
    license: "{{ package.License }}",
    licensesUrl: "{{ package.LicensesUrl }}",
  },
{{~ end ~}}
};

const $ = (id) => document.getElementById(id);
const addToVcc = () => window.location.assign(`vcc://vpm/addRepo?url=${encodeURIComponent(LISTING_URL)}`);

// ---------- Dialogs ----------

const openDialog = (dialog) => {
  if (!dialog.open) dialog.showModal();
};

document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.querySelectorAll('.modal-close').forEach((button) => {
    button.addEventListener('click', () => dialog.close());
  });
  // Close when clicking the backdrop (outside the dialog box).
  dialog.addEventListener('click', (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) dialog.close();
  });
});

const helpDialog = $('addListingToVccHelp');
$('urlBarHelp').addEventListener('click', () => openDialog(helpDialog));
$('packageInfoListingHelp').addEventListener('click', () => openDialog(helpDialog));
$('vccAddRepoButton').addEventListener('click', addToVcc);

// ---------- Copy buttons ----------

document.querySelectorAll('.copy-button').forEach((button) => {
  const label = button.querySelector('span');
  const original = label.textContent;
  let timer;
  button.addEventListener('click', async () => {
    const field = $(button.dataset.copyTarget);
    field.select();
    try {
      await navigator.clipboard.writeText(field.value);
    } catch {
      document.execCommand('copy');
    }
    button.classList.add('is-copied');
    label.textContent = 'Copied!';
    clearTimeout(timer);
    timer = setTimeout(() => {
      button.classList.remove('is-copied');
      label.textContent = original;
    }, 1200);
  });
});

// ---------- Search ----------

const searchInput = $('searchInput');
const searchEmpty = $('searchEmpty');
const packageRows = [...document.querySelectorAll('#packageList .package')];

searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLowerCase();
  let visible = 0;
  packageRows.forEach((row) => {
    const match = query === ''
      || row.dataset.packageName?.toLowerCase().includes(query)
      || row.dataset.packageId?.toLowerCase().includes(query);
    row.classList.toggle('hidden', !match);
    if (match) visible++;
  });
  searchEmpty.classList.toggle('hidden', visible > 0);
});

// ---------- Package info ----------

const infoDialog = $('packageInfoModal');
const info = {
  name: $('packageInfoName'),
  id: $('packageInfoId'),
  version: $('packageInfoVersion'),
  description: $('packageInfoDescription'),
  author: $('packageInfoAuthor'),
  dependencies: $('packageInfoDependencies'),
  keywords: $('packageInfoKeywords'),
  license: $('packageInfoLicense'),
};
const toggleBlock = (id, show) => $(id).classList.toggle('hidden', !show);

document.querySelectorAll('.rowPackageInfoButton').forEach((button) => {
  button.addEventListener('click', () => {
    const packageId = button.dataset.packageId;
    const pkg = PACKAGES[packageId];
    if (!pkg) {
      console.error(`Did not find package ${packageId}. Packages available:`, PACKAGES);
      return;
    }

    info.name.textContent = pkg.displayName || pkg.name;
    info.id.textContent = packageId;
    info.version.textContent = `v${pkg.version}`;
    info.description.textContent = pkg.description;

    toggleBlock('packageInfoAuthorBlock', !!pkg.author.name);
    info.author.textContent = pkg.author.name;
    if (pkg.author.url) {
      info.author.href = pkg.author.url;
    } else {
      info.author.removeAttribute('href');
    }

    const deps = Object.entries(pkg.dependencies);
    toggleBlock('packageInfoDependenciesBlock', deps.length > 0);
    info.dependencies.replaceChildren(...deps.map(([name, version]) => {
      const li = document.createElement('li');
      const code = document.createElement('code');
      code.textContent = name;
      li.append(code, ` @ v${version}`);
      return li;
    }));

    toggleBlock('packageInfoKeywordsBlock', pkg.keywords.length > 0);
    info.keywords.replaceChildren(...pkg.keywords.map((keyword) => {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = keyword;
      return badge;
    }));

    toggleBlock('packageInfoLicenseBlock', !!(pkg.license || pkg.licensesUrl));
    info.license.textContent = pkg.license || 'See License';
    if (pkg.licensesUrl) {
      info.license.href = pkg.licensesUrl;
    } else {
      info.license.removeAttribute('href');
    }

    openDialog(infoDialog);
    infoDialog.scrollTop = 0;
  });
});
