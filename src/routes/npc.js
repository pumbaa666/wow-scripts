const router = require('express').Router();
const superagent = require('superagent');
const logger = require('../utils/logging').getLogger('npc');
const StringBuilder = require("string-builder");

const baseurl = 'https://classicdb.com/?npc='; //'https://www.nostalgeek-serveur.com/db/?npc=';


router.post('/', async (req, res, next) => {
  const npcId = req.body.npcId;
  res.redirect('/npc/' + npcId);
});

router.get('/:npcId', async (req, res, next) => {
  const npcId = req.params.npcId;
  logger.info("requesting NPC " + npcId);

  const wowResult = await superagent.get(baseurl + npcId);
  if(wowResult.status != 200) {
    logger.error("Aborting", wowResult);
    return;
  }

  const htmlText = wowResult.text;

  let npcStr = new StringBuilder("<html><body>");
  const npcName = getNpcName(htmlText);
  npcStr.append("<h1>" + npcName + "</h1>");

  const npcModel = getNpcModel(htmlText);
  npcStr.append("<img src = '" + npcModel + "' /><br/></br>");

  header(npcId, npcStr);


  const ids = getIdsToDelete(htmlText);
  ids.forEach(id => {
    npcStr.append(".npc delitem " + id + "<br/>");
  });

  footer(npcId, npcStr);

  res.end(npcStr.toString());
});

function header(npcId, npcStr) {
  // npcStr.append("<html><body>");
  npcStr.append(".npc add " + npcId + "<br/>");
  npcStr.append("-----------------------<br/>");
}

function footer(npcId, npcStr) {
  npcStr.append('<br/><form action = "./" method = "post">Seek for a new NPC <input type="text" name = "npcId" value = "' + npcId + '" size = "5" /><input type = "submit" value = "GO" /></form>');
  npcStr.append('</body></html>');
}

function getNpcName(htmlText) {
  const regex = new RegExp("<h1>(.*)</h1>", "i");
  let match = regex.exec(htmlText);
  if(match == null || match.length < 2) {
    console.error("Unable to fetch NPC name");
    return;
  }

  return match[1];
}

function getNpcModel(htmlText) {
  const regex = new RegExp("modelviewer img=(.*\.png)", "i");
  let match = regex.exec(htmlText);
  if(match == null || match.length < 2) {
    console.error("Unable to fetch NPC model");
    return;
  }

  return match[1];
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
    
    const regex = new RegExp("id:([0-9]+)", "gi"); // Ex: id:1234
    let match = regex.exec(template);
    while (match != null) {
      const id = match[1];
      match = regex.exec(template);

      ids.push(id);
    }

    break; // On a trouvé le tableau 'Sells' on peut quitter
  };

  return ids;
}

module.exports = router;
