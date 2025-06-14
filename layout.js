// --- START OF FILE layout.js ---

/**
 * Génère le contenu de la balise <head> du document.
 * @param {string} pageTitle Le titre spécifique de la page.
 */
function generateHead(pageTitle) {
  document.write(`
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle}</title>
    
    <!-- PWA additions -->
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#25282c">
    <link rel="apple-touch-icon" href="icon-192x192.png">

    <!-- Polices & Icônes -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&family=Orbitron:wght@500&family=Stardos+Stencil:wght@700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css" integrity="sha512-xh6O/CkQoPOWDdYTDqeRdPCVd1SpvCA9XXcUnZS2FmJNp1coAFzvtCN9BmamE+4aHK8yyUHUSCcJHgXloTyT2A==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    
    <!-- Styles Externes -->
    <link rel="stylesheet" href="style.css">
  `);
}

/**
 * Génère les balises <script> de fin de page, incluant le Service Worker et les scripts spécifiques.
 * @param {string[]} pageSpecificScripts Un tableau des chemins vers les scripts spécifiques à la page.
 */
function generateFooterScripts(pageSpecificScripts = []) {
  // Script d'initialisation du Service Worker (commun à toutes les pages)
  const serviceWorkerScript = `
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('Service Worker enregistré avec succès:', registration.scope);
                })
                .catch(error => {
                    console.log('Erreur lors de l'enregistrement du Service Worker:', error);
                });
        });
    }
  `;
  document.write(`<script>${serviceWorkerScript}<\/script>`);

  // Scripts spécifiques à la page
  pageSpecificScripts.forEach(scriptPath => {
    // L'attribut 'defer' est important pour que le script s'exécute après le parsing du DOM
    document.write(`<script src="${scriptPath}" defer><\/script>`);
  });
}
// --- END OF FILE layout.js ---