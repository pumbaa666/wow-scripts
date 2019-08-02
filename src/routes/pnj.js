const router = require('express').Router();
const superagent = require('superagent');
const logger = require('../utils/logging').getLogger('pnj');
const StringBuilder = require("string-builder");

const baseurl = 'https://www.nostalgeek-serveur.com/db/?npc=';


router.post('/', async (req, res, next) => {
  const pnjId = req.body.pnjId;
  res.redirect('/pnj/' + pnjId);
});

router.get('/:pnjId', async (req, res, next) => {
  const pnjId = req.params.pnjId;
  logger.info("requesting PNJ", pnjId);

  const wowResult = await superagent.get(baseurl + pnjId);
  if(wowResult.status != 200) {
    logger.error("Aborting", wowResult);
    return;
  }

  const htmlText = wowResult.text;

  let pnjStr = new StringBuilder("<html><body>");
  const pnjName = getPnjName(htmlText);
  pnjStr.append("<h1>" + pnjName + "</h1>");

  header(pnjId, pnjStr);


  const ids = getIdsToDelete(htmlText);
  ids.forEach(id => {
    pnjStr.append(".npc delitem " + id + "<br/>");
  });

  footer(pnjId, pnjStr);

  res.end(pnjStr.toString());
});

function header(pnjId, pnjStr) {
  // pnjStr.append("<html><body>");
  pnjStr.append(".npc add " + pnjId + "<br/>");
  pnjStr.append("-----------------------<br/>");
}

function footer(pnjId, pnjStr) {
  pnjStr.append('<br/><form action = "./" method = "post">Seek for a new NPC <input type="text" name = "pnjId" value = "' + pnjId + '" size = "5" /><input type = "submit" value = "GO" /></form>');
  pnjStr.append('</body></html>');
}

function getPnjName(htmlText) {
  const regex = new RegExp("<h1>.*</h1>", "i");
  let match = regex.exec(htmlText);
  while (match != null) {
    const pnjName = match[0].replace("<h1>", "").replace("</h1>", "");
    return pnjName;
  }
}

function getIdsToDelete(htmlText) {
  let ids = [];

  const templates = htmlText.split("new Listview");
  
  // On commence à 1 car l'indice 0 c'est la string complète
  for(var i = 1; i < templates.length; i++) {
    const template = templates[i];
    
    // On n'est pas dans le bon onlget
    if(template.indexOf("{template:'item',id:'sells'") < 0)
      continue;
    
    const regex = new RegExp("id:[0-9]+", "gi"); // Ex: id:1234
    let match = regex.exec(template);
    while (match != null) {
      const id = match[0].replace("id:", "");
      match = regex.exec(template);

      ids.push(id);
    }

    break; // On a trouvé le tableau 'Sells' on peut quitter
  };

  return ids;
}

module.exports = router;
