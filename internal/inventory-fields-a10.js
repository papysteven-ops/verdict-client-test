(function (root) {
  'use strict';
  var messages = {
    fr: ['Champ invalide : ', 'La fiche reste ouverte : sauvegarde non confirmée.', 'Modification non autorisée', 'Seuils à renseigner'],
    en: ['Invalid field: ', 'The form remains open: saving was not confirmed.', 'Change not permitted', 'Thresholds missing'],
    es: ['Campo no válido: ', 'La ficha sigue abierta: no se ha confirmado el guardado.', 'Cambio no permitido', 'Umbrales por completar'],
    it: ['Campo non valido: ', 'La scheda resta aperta: il salvataggio non è confermato.', 'Modifica non consentita', 'Soglie da completare'],
    de: ['Ungültiges Feld: ', 'Das Formular bleibt geöffnet: Speichern wurde nicht bestätigt.', 'Änderung nicht erlaubt', 'Grenzwerte fehlen'],
    nl: ['Ongeldig veld: ', 'Het formulier blijft open: opslaan is niet bevestigd.', 'Wijziging niet toegestaan', 'Drempelwaarden ontbreken'],
    pt: ['Campo inválido: ', 'A ficha permanece aberta: a gravação não foi confirmada.', 'Alteração não permitida', 'Limites por preencher']
  };
  function text(index) { var lang = String(root.document && root.document.documentElement.lang || 'fr').split('-')[0]; return (messages[lang] || messages.fr)[index]; }
  function parseFields(read) {
    var F = root.VerdictFinance, fields = { goal: ['pGoal', false], min: ['pMin', false], price: ['pPrice', false], pack: ['pPack', false], minOrder: ['pMinOrder', false], leadDays: ['pLead', true], shelfLifeDays: ['pShelf', true] }, result = {}, errors = [];
    Object.keys(fields).forEach(function (name) { var config = fields[name], raw = read(config[0]), parsed = F.parseInput(raw, { nonnegative: true, integer: config[1], positive: name === 'pack' }); if (parsed.state === 'invalid') errors.push({ field: config[0], reason: parsed.reason }); result[name] = parsed.value; });
    if (result.pack === null && !errors.some(function (e) { return e.field === 'pPack'; })) result.pack = 1;
    return { ok: errors.length === 0, fields: result, errors: errors };
  }
  root.VerdictInventoryFields = { parse: parseFields, text: text, messages: messages };
  if (typeof module === 'object' && module.exports) module.exports = root.VerdictInventoryFields;
})(typeof globalThis !== 'undefined' ? globalThis : this);
