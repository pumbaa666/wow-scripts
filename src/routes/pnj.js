const router = require('express').Router();
const superagent = require('superagent');
const logger = require('../utils/logging').getLogger('pnj');

const baseurl = 'https://www.nostalgeek-serveur.com/db/?npc=';


router.post('/', async (req, res, next) => {
  const pnjId = req.body.pnjId;
  res.redirect('/pnj/' + pnjId);
});

router.get('/:pnjId', async (req, res, next) => {
    const pnjId = req.params.pnjId;
    logger.info("requesting PNJ", pnjId);

    const pnj = {id: pnjId, sellItems: []};
    let pnjStr = "<html><body>";
  
    const wowResult = await superagent.get(baseurl + pnjId);
    if(wowResult.status != 200) {
      logger.error("Aborting", wowResult);
      return;
    }
    pnjStr = pnjStr + ".npc add " + pnjId + "<br/>";
    pnjStr = pnjStr + "-----------------------<br/>";
  
    const htmlText = wowResult.text;
    const templates = htmlText.split("new Listview");
  
    // On commence à 1 car l'indice 0 c'est la string complète
    for(var i = 1; i < templates.length; i++) {
      const template = templates[i];
      
      // On n'est pas dans le bon onlget
      if(template.indexOf("{template:'item',id:'sells'") < 0)
        continue;
      
      const regex = /id:[0-9]+/g; // Ex: id:1234
      let match = regex.exec(template);
      while (match != null) {
        const id = match[0].replace("id:", ""); // On vire les accolades
        match = regex.exec(template);

        pnj.sellItems.push(id);
        pnjStr = pnjStr + ".npc delitem " + id + "<br/>";
      }
  
      break; // On a trouvé le tableau 'Sells' on peut quitter
    };

    pnjStr = pnjStr + '<form action = "./" method = "post"><input type="text" name = "pnjId" value = "'+pnjId+'" /><input type = "submit" value = "PNJ" /></form>'
    pnjStr =  pnjStr + '</body></html>';

    // res.set('content-type', 'application/json');
    // res.json(pnj);
    // res.set('content-type', 'application/json');
    res.end(pnjStr);
});

module.exports = router;
