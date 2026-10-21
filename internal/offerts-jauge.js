/* VERDICT R316 — Offerts, remises et annulations : déclaration par le patron + jauge du mois.
 * Données : DB.caisseDecl (journal des déclarations, montants en centimes), DB.offertsEnveloppe (centimes/mois, facultatif).
 * Les totaux du jour sont reportés dans DB.caisseAjust (format existant, lu par « Où part l'argent » et Vera).
 * Règles : absent ≠ zéro ; le CA saisi reste le montant encaissé (un offert n'en est jamais retiré une 2e fois) ;
 * un import de caisse réel fait foi pour son jour (la déclaration est gardée au journal, non ajoutée) ;
 * une déclaration annulée reste visible, barrée, et sort des totaux. Aucune donnée inventée. */
(function () {
  'use strict';
  var W = window;
  var TYPES = ['offerts', 'remises', 'annulations'];
  var DECL = ['offerts', 'remises']; /* R317 : les annulations viennent uniquement de la caisse (journalisées par la loi), Verdict ne les demande pas. */
  var MOTIFS = ['fidele', 'geste', 'erreur', 'refus', 'autre'];
  var COL = { vert: '#22c55e', jaune: '#eab308', orange: '#f97316', rouge: '#ef4444' };
  var TXT = {
    fr: { lockPro: 'Avec Pro : jauge du mois, déclaration et journal des offerts et remises. La saisie du chiffre du jour reste incluse dans Pilotage.', lockBtn: 'Voir les offres', annulCaisse: 'Annulations : lues dans votre caisse, rien à saisir.', annulSans: 'Annulations : Verdict les lit dans l’export de votre caisse quand il les contient. Rien à saisir ici.', annulAbsent: 'aucun export de caisse ne les donne', importCaisse: 'Importer l’export de caisse (CSV)', koAnnul: 'Les annulations se lisent dans votre caisse : importez son export, rien à saisir ici.', s_offerts: 'Offert', s_remises: 'Remise', s_annulations: 'Annulation', titre: 'Offerts, remises et annulations', mois: 'Mois en cours · {m}', gestes: 'Gestes commerciaux (offerts + remises)', rien: 'Aucun offert ni remise déclaré ce mois-ci.', offerts: 'Offerts', remises: 'Remises', annulations: 'Annulations', nonDecl: 'non déclaré', pour100: 'Soit {v} d’offerts et de remises pour 100 € encaissés ce mois-ci (annulations à part).', proj: 'À ce rythme : environ {v} sur un an.', env: 'Budget du mois : {v}', envAucune: 'Aucun budget fixé pour les offerts et remises.', envFixer: 'Fixer un budget', envRetirer: 'Retirer le budget', envLabel: 'Budget du mois (€ TTC)', z_vert: 'Dans le budget', z_jaune: 'Proche de la limite', z_orange: 'Enveloppe dépassée', z_rouge: 'Nettement dépassée', jauge: '{z} · {a} sur {b}', add_offerts: '+ Offert', add_remises: '+ Remise', add_annulations: '+ Annulation', montant: 'Montant (€ TTC)', motif: 'Motif', m_fidele: 'Client fidèle', m_geste: 'Geste commercial', m_erreur: 'Erreur de service ou de cuisine', m_refus: 'Produit refusé ou retourné', m_autre: 'Autre', enregistrer: 'Enregistrer', fermer: 'Fermer', annuler: 'Annuler', annuleLe: 'annulé à {h}', journal: 'Déclarés le {d}', journalVide: 'Rien de déclaré pour cette journée.', note: 'Les offerts ne sont pas déduits de vos ventes de la journée : le chiffre saisi est déjà le bon.', ok: 'Enregistré : {t} de {v}, journée du {d}.', okAnnule: 'Déclaration annulée : elle sort des totaux.', koMontant: 'Montant illisible : écrivez par exemple 3 ou 3,50.', koZero: 'Un montant de 0 € n’est pas enregistré.', koMax: 'Montant inhabituel (plus de 10 000 €) : non enregistré, vérifiez la saisie.', koDouble: 'Déclaration identique déjà enregistrée à l’instant : non dupliquée.', koSave: 'L’enregistrement a échoué : rien n’a été modifié.', importPrime: 'Ce jour est couvert par l’import de caisse : la déclaration est gardée au journal mais pas ajoutée, pour ne pas compter deux fois.', demo: 'Démonstration : les déclarations ne sont pas conservées après fermeture.', envOk: 'Enveloppe enregistrée.', envKo: 'Enveloppe illisible : écrivez un montant positif, par exemple 150.', envRetiree: 'Enveloppe retirée.' },
    en: { lockPro: "With Pro: monthly gauge, logging and journal of comps and discounts. Entering today's takings stays included in Pilotage.", lockBtn: 'See the plans', annulCaisse: 'Voids: read from your till, nothing to enter.', annulSans: 'Voids: Verdict reads them from your till export when it includes them. Nothing to enter here.', annulAbsent: 'no till export provides them', importCaisse: 'Import the till export (CSV)', koAnnul: 'Voids are read from your till: import its export, nothing to enter here.', s_offerts: 'Comp', s_remises: 'Discount', s_annulations: 'Void', titre: 'Comps, discounts and voids', mois: 'Current month · {m}', gestes: 'Goodwill (comps + discounts)', rien: 'No comp or discount declared this month.', offerts: 'Comps', remises: 'Discounts', annulations: 'Voids', nonDecl: 'not declared', pour100: 'That is {v} per €100 taken this month.', proj: 'At this pace: about {v} over 12 months (projection).', env: 'Monthly allowance: {v}', envAucune: 'No allowance set: the gauge has no limit.', envFixer: 'Set an allowance', envRetirer: 'Remove the allowance', envLabel: 'Monthly allowance (€ incl. VAT)', z_vert: 'Within allowance', z_jaune: 'Close to the limit', z_orange: 'Allowance exceeded', z_rouge: 'Well over the allowance', jauge: '{z} · {a} of {b}', add_offerts: '+ Comp', add_remises: '+ Discount', add_annulations: '+ Void', montant: 'Amount (€ incl. VAT)', motif: 'Reason', m_fidele: 'Regular customer', m_geste: 'Goodwill gesture', m_erreur: 'Service or kitchen error', m_refus: 'Dish refused or returned', m_autre: 'Other', enregistrer: 'Save', fermer: 'Close', annuler: 'Cancel', annuleLe: 'cancelled at {h}', journal: 'Declared on {d}', journalVide: 'Nothing declared for this day.', note: 'Revenue entered stays what was taken: a comp is never deducted a second time.', ok: 'Saved: {t} of {v}, day of {d}.', okAnnule: 'Declaration cancelled: it leaves the totals.', koMontant: 'Unreadable amount: write for example 3 or 3.50.', koZero: 'An amount of €0 is not saved.', koMax: 'Unusual amount (over €10,000): not saved, please check.', koDouble: 'Identical declaration just saved: not duplicated.', koSave: 'Saving failed: nothing was changed.', importPrime: 'This day is covered by the till import: the declaration is kept in the log but not added, so nothing is counted twice.', demo: 'Demo: declarations are not kept after closing.', envOk: 'Allowance saved.', envKo: 'Unreadable allowance: enter a positive amount, for example 150.', envRetiree: 'Allowance removed.' },
    es: { lockPro: 'Con Pro: indicador del mes, declaración y registro de invitaciones y descuentos. La entrada de la venta del día sigue incluida en Pilotage.', lockBtn: 'Ver las ofertas', annulCaisse: 'Anulaciones: se leen en su caja, nada que introducir.', annulSans: 'Anulaciones: Verdict las lee en la exportación de su caja cuando las contiene. Nada que introducir aquí.', annulAbsent: 'no facilitadas por la caja', importCaisse: 'Importar la exportación de caja (CSV)', koAnnul: 'Las anulaciones se leen en su caja: importe su exportación, nada que introducir aquí.', s_offerts: 'Invitación', s_remises: 'Descuento', s_annulations: 'Anulación', titre: 'Invitaciones, descuentos y anulaciones', mois: 'Mes en curso · {m}', gestes: 'Gestos comerciales (invitaciones + descuentos)', rien: 'Ninguna invitación ni descuento declarado este mes.', offerts: 'Invitaciones', remises: 'Descuentos', annulations: 'Anulaciones', nonDecl: 'no declarado', pour100: 'Es decir, {v} por cada 100 € cobrados este mes.', proj: 'A este ritmo: unos {v} en 12 meses (proyección).', env: 'Presupuesto del mes: {v}', envAucune: 'Sin presupuesto fijado: el indicador no tiene límite.', envFixer: 'Fijar un presupuesto', envRetirer: 'Quitar el presupuesto', envLabel: 'Presupuesto mensual (€ con IVA)', z_vert: 'Dentro del presupuesto', z_jaune: 'Cerca del límite', z_orange: 'Presupuesto superado', z_rouge: 'Muy por encima', jauge: '{z} · {a} de {b}', add_offerts: '+ Invitación', add_remises: '+ Descuento', add_annulations: '+ Anulación', montant: 'Importe (€ con IVA)', motif: 'Motivo', m_fidele: 'Cliente habitual', m_geste: 'Gesto comercial', m_erreur: 'Error de sala o de cocina', m_refus: 'Plato rechazado o devuelto', m_autre: 'Otro', enregistrer: 'Guardar', fermer: 'Cerrar', annuler: 'Anular', annuleLe: 'anulado a las {h}', journal: 'Declarado el {d}', journalVide: 'Nada declarado para este día.', note: 'La facturación introducida sigue siendo la cobrada: una invitación nunca se resta dos veces.', ok: 'Guardado: {t} de {v}, día {d}.', okAnnule: 'Declaración anulada: sale de los totales.', koMontant: 'Importe ilegible: escriba por ejemplo 3 o 3,50.', koZero: 'Un importe de 0 € no se guarda.', koMax: 'Importe inusual (más de 10 000 €): no guardado, compruébelo.', koDouble: 'Declaración idéntica recién guardada: no duplicada.', koSave: 'Error al guardar: no se ha modificado nada.', importPrime: 'Este día está cubierto por la importación de caja: la declaración se conserva en el registro pero no se suma, para no contar dos veces.', demo: 'Demostración: las declaraciones no se conservan al cerrar.', envOk: 'Presupuesto guardado.', envKo: 'Presupuesto ilegible: escriba un importe positivo, por ejemplo 150.', envRetiree: 'Presupuesto quitado.' },
    it: { lockPro: 'Con Pro: indicatore del mese, dichiarazione e registro di omaggi e sconti. L’inserimento dell’incasso del giorno resta incluso in Pilotage.', lockBtn: 'Vedi le offerte', annulCaisse: 'Storni: letti dalla cassa, niente da inserire.', annulSans: 'Storni: Verdict li legge nell’esportazione della cassa quando li contiene. Niente da inserire qui.', annulAbsent: 'non forniti dalla cassa', importCaisse: 'Importa l’esportazione della cassa (CSV)', koAnnul: 'Gli storni si leggono dalla cassa: importa la sua esportazione, niente da inserire qui.', s_offerts: 'Omaggio', s_remises: 'Sconto', s_annulations: 'Storno', titre: 'Omaggi, sconti e storni', mois: 'Mese in corso · {m}', gestes: 'Gesti commerciali (omaggi + sconti)', rien: 'Nessun omaggio né sconto dichiarato questo mese.', offerts: 'Omaggi', remises: 'Sconti', annulations: 'Storni', nonDecl: 'non dichiarato', pour100: 'Cioè {v} ogni 100 € incassati questo mese.', proj: 'A questo ritmo: circa {v} in 12 mesi (proiezione).', env: 'Budget del mese: {v}', envAucune: 'Nessun budget fissato: l’indicatore non ha limite.', envFixer: 'Fissa un budget', envRetirer: 'Rimuovi il budget', envLabel: 'Budget mensile (€ IVA inclusa)', z_vert: 'Nel budget', z_jaune: 'Vicino al limite', z_orange: 'Budget superato', z_rouge: 'Nettamente superato', jauge: '{z} · {a} su {b}', add_offerts: '+ Omaggio', add_remises: '+ Sconto', add_annulations: '+ Storno', montant: 'Importo (€ IVA inclusa)', motif: 'Motivo', m_fidele: 'Cliente abituale', m_geste: 'Gesto commerciale', m_erreur: 'Errore di sala o di cucina', m_refus: 'Piatto rifiutato o reso', m_autre: 'Altro', enregistrer: 'Salva', fermer: 'Chiudi', annuler: 'Annulla', annuleLe: 'annullato alle {h}', journal: 'Dichiarati il {d}', journalVide: 'Niente di dichiarato per questo giorno.', note: 'L’incasso inserito resta quello incassato: un omaggio non viene mai sottratto due volte.', ok: 'Salvato: {t} di {v}, giorno {d}.', okAnnule: 'Dichiarazione annullata: esce dai totali.', koMontant: 'Importo illeggibile: scrivi ad esempio 3 o 3,50.', koZero: 'Un importo di 0 € non viene salvato.', koMax: 'Importo insolito (oltre 10 000 €): non salvato, verifica.', koDouble: 'Dichiarazione identica appena salvata: non duplicata.', koSave: 'Salvataggio non riuscito: nulla è stato modificato.', importPrime: 'Questo giorno è coperto dall’importazione della cassa: la dichiarazione resta nel registro ma non viene sommata, per non contare due volte.', demo: 'Dimostrazione: le dichiarazioni non vengono conservate dopo la chiusura.', envOk: 'Budget salvato.', envKo: 'Budget illeggibile: scrivi un importo positivo, ad esempio 150.', envRetiree: 'Budget rimosso.' },
    de: { lockPro: 'Mit Pro: Monatsanzeige, Erfassung und Protokoll von Einladungen und Rabatten. Die Eingabe des Tagesumsatzes bleibt in Pilotage enthalten.', lockBtn: 'Angebote ansehen', annulCaisse: 'Stornos: aus Ihrer Kasse gelesen, nichts einzugeben.', annulSans: 'Stornos: Verdict liest sie aus Ihrem Kassenexport, wenn er sie enthält. Hier ist nichts einzugeben.', annulAbsent: 'von der Kasse nicht geliefert', importCaisse: 'Kassenexport importieren (CSV)', koAnnul: 'Stornos werden aus Ihrer Kasse gelesen: Export importieren, hier nichts eingeben.', s_offerts: 'Einladung', s_remises: 'Rabatt', s_annulations: 'Storno', titre: 'Einladungen, Rabatte und Stornos', mois: 'Laufender Monat · {m}', gestes: 'Kulanz (Einladungen + Rabatte)', rien: 'In diesem Monat keine Einladung und kein Rabatt erfasst.', offerts: 'Einladungen', remises: 'Rabatte', annulations: 'Stornos', nonDecl: 'nicht erfasst', pour100: 'Das sind {v} je 100 € Einnahmen in diesem Monat.', proj: 'In diesem Tempo: etwa {v} in 12 Monaten (Hochrechnung).', env: 'Monatsbudget: {v}', envAucune: 'Kein Budget festgelegt: die Anzeige hat keine Grenze.', envFixer: 'Budget festlegen', envRetirer: 'Budget entfernen', envLabel: 'Monatsbudget (€ inkl. MwSt.)', z_vert: 'Im Budget', z_jaune: 'Nahe am Limit', z_orange: 'Budget überschritten', z_rouge: 'Deutlich überschritten', jauge: '{z} · {a} von {b}', add_offerts: '+ Einladung', add_remises: '+ Rabatt', add_annulations: '+ Storno', montant: 'Betrag (€ inkl. MwSt.)', motif: 'Grund', m_fidele: 'Stammgast', m_geste: 'Kulanz', m_erreur: 'Fehler im Service oder in der Küche', m_refus: 'Gericht abgelehnt oder zurückgegeben', m_autre: 'Sonstiges', enregistrer: 'Speichern', fermer: 'Schließen', annuler: 'Stornieren', annuleLe: 'storniert um {h}', journal: 'Erfasst am {d}', journalVide: 'Für diesen Tag nichts erfasst.', note: 'Der erfasste Umsatz bleibt der eingenommene: eine Einladung wird nie ein zweites Mal abgezogen.', ok: 'Gespeichert: {t} über {v}, Tag {d}.', okAnnule: 'Erfassung storniert: sie zählt nicht mehr zu den Summen.', koMontant: 'Betrag unlesbar: z. B. 3 oder 3,50 eingeben.', koZero: 'Ein Betrag von 0 € wird nicht gespeichert.', koMax: 'Ungewöhnlicher Betrag (über 10 000 €): nicht gespeichert, bitte prüfen.', koDouble: 'Identische Erfassung gerade gespeichert: nicht doppelt erfasst.', koSave: 'Speichern fehlgeschlagen: nichts wurde geändert.', importPrime: 'Dieser Tag ist durch den Kassenimport abgedeckt: die Erfassung bleibt im Protokoll, wird aber nicht addiert, damit nichts doppelt zählt.', demo: 'Demo: Erfassungen werden nach dem Schließen nicht behalten.', envOk: 'Budget gespeichert.', envKo: 'Budget unlesbar: einen positiven Betrag eingeben, z. B. 150.', envRetiree: 'Budget entfernt.' },
    nl: { lockPro: 'Met Pro: maandmeter, invoer en logboek van aangeboden posten en kortingen. Het invoeren van de dagomzet blijft inbegrepen in Pilotage.', lockBtn: 'Bekijk de abonnementen', annulCaisse: 'Annuleringen: uit uw kassa gelezen, niets in te voeren.', annulSans: 'Annuleringen: Verdict leest ze uit uw kassa-export als die ze bevat. Hier niets in te vullen.', annulAbsent: 'niet geleverd door de kassa', importCaisse: 'Kassa-export importeren (CSV)', koAnnul: 'Annuleringen worden uit uw kassa gelezen: importeer de export, hier niets invoeren.', s_offerts: 'Aangeboden', s_remises: 'Korting', s_annulations: 'Annulering', titre: 'Aangeboden, kortingen en annuleringen', mois: 'Lopende maand · {m}', gestes: 'Commerciële gebaren (aangeboden + kortingen)', rien: 'Deze maand niets aangeboden en geen korting gemeld.', offerts: 'Aangeboden', remises: 'Kortingen', annulations: 'Annuleringen', nonDecl: 'niet gemeld', pour100: 'Dat is {v} per 100 € ontvangen deze maand.', proj: 'In dit tempo: ongeveer {v} over 12 maanden (projectie).', env: 'Maandbudget: {v}', envAucune: 'Geen budget ingesteld: de meter heeft geen grens.', envFixer: 'Budget instellen', envRetirer: 'Budget verwijderen', envLabel: 'Maandbudget (€ incl. btw)', z_vert: 'Binnen budget', z_jaune: 'Dicht bij de grens', z_orange: 'Budget overschreden', z_rouge: 'Ruim overschreden', jauge: '{z} · {a} van {b}', add_offerts: '+ Aangeboden', add_remises: '+ Korting', add_annulations: '+ Annulering', montant: 'Bedrag (€ incl. btw)', motif: 'Reden', m_fidele: 'Vaste klant', m_geste: 'Commercieel gebaar', m_erreur: 'Fout in bediening of keuken', m_refus: 'Gerecht geweigerd of teruggestuurd', m_autre: 'Anders', enregistrer: 'Opslaan', fermer: 'Sluiten', annuler: 'Annuleren', annuleLe: 'geannuleerd om {h}', journal: 'Gemeld op {d}', journalVide: 'Niets gemeld voor deze dag.', note: 'De ingevoerde omzet blijft de ontvangen omzet: iets aangebodens wordt nooit twee keer afgetrokken.', ok: 'Opgeslagen: {t} van {v}, dag {d}.', okAnnule: 'Melding geannuleerd: telt niet meer mee in de totalen.', koMontant: 'Bedrag onleesbaar: schrijf bijvoorbeeld 3 of 3,50.', koZero: 'Een bedrag van 0 € wordt niet opgeslagen.', koMax: 'Ongebruikelijk bedrag (meer dan 10 000 €): niet opgeslagen, controleer.', koDouble: 'Identieke melding zojuist opgeslagen: niet dubbel.', koSave: 'Opslaan mislukt: er is niets gewijzigd.', importPrime: 'Deze dag valt onder de kassa-import: de melding blijft in het logboek maar wordt niet opgeteld, zodat niets dubbel telt.', demo: 'Demo: meldingen worden na sluiten niet bewaard.', envOk: 'Budget opgeslagen.', envKo: 'Budget onleesbaar: voer een positief bedrag in, bijvoorbeeld 150.', envRetiree: 'Budget verwijderd.' },
    pt: { lockPro: 'Com Pro: indicador do mês, declaração e registo de ofertas e descontos. A introdução da faturação do dia continua incluída no Pilotage.', lockBtn: 'Ver as ofertas', annulCaisse: 'Anulações: lidas na sua caixa, nada a introduzir.', annulSans: 'Anulações: o Verdict lê-as na exportação da sua caixa quando as contém. Nada a introduzir aqui.', annulAbsent: 'não fornecidas pela caixa', importCaisse: 'Importar a exportação da caixa (CSV)', koAnnul: 'As anulações leem-se na sua caixa: importe a exportação, nada a introduzir aqui.', s_offerts: 'Oferta', s_remises: 'Desconto', s_annulations: 'Anulação', titre: 'Ofertas, descontos e anulações', mois: 'Mês em curso · {m}', gestes: 'Gestos comerciais (ofertas + descontos)', rien: 'Nenhuma oferta nem desconto declarado este mês.', offerts: 'Ofertas', remises: 'Descontos', annulations: 'Anulações', nonDecl: 'não declarado', pour100: 'Ou seja, {v} por cada 100 € recebidos este mês.', proj: 'A este ritmo: cerca de {v} em 12 meses (projeção).', env: 'Limite do mês: {v}', envAucune: 'Sem limite definido: o indicador não tem teto.', envFixer: 'Definir um limite', envRetirer: 'Remover o limite', envLabel: 'Limite mensal (€ com IVA)', z_vert: 'Dentro do limite', z_jaune: 'Perto do limite', z_orange: 'Limite ultrapassado', z_rouge: 'Muito acima do limite', jauge: '{z} · {a} de {b}', add_offerts: '+ Oferta', add_remises: '+ Desconto', add_annulations: '+ Anulação', montant: 'Montante (€ com IVA)', motif: 'Motivo', m_fidele: 'Cliente habitual', m_geste: 'Gesto comercial', m_erreur: 'Erro de sala ou de cozinha', m_refus: 'Prato recusado ou devolvido', m_autre: 'Outro', enregistrer: 'Guardar', fermer: 'Fechar', annuler: 'Anular', annuleLe: 'anulado às {h}', journal: 'Declarado em {d}', journalVide: 'Nada declarado para este dia.', note: 'A faturação introduzida continua a ser a recebida: uma oferta nunca é subtraída duas vezes.', ok: 'Guardado: {t} de {v}, dia {d}.', okAnnule: 'Declaração anulada: sai dos totais.', koMontant: 'Montante ilegível: escreva por exemplo 3 ou 3,50.', koZero: 'Um montante de 0 € não é guardado.', koMax: 'Montante invulgar (mais de 10 000 €): não guardado, verifique.', koDouble: 'Declaração idêntica acabada de guardar: não duplicada.', koSave: 'Falha ao guardar: nada foi alterado.', importPrime: 'Este dia está coberto pela importação da caixa: a declaração fica no registo mas não é somada, para não contar duas vezes.', demo: 'Demonstração: as declarações não são guardadas depois de fechar.', envOk: 'Limite guardado.', envKo: 'Limite ilegível: escreva um montante positivo, por exemplo 150.', envRetiree: 'Limite removido.' }
  };
  var LOC = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES', it: 'it-IT', de: 'de-DE', nl: 'nl-NL', pt: 'pt-PT' };

  function lang() { var l = String(document.documentElement.lang || 'fr').slice(0, 2).toLowerCase(); return TXT[l] ? l : 'fr'; }
  function T(k, p) { var s = TXT[lang()][k] != null ? TXT[lang()][k] : TXT.fr[k]; return p ? s.replace(/\{(\w+)\}/g, function (_, x) { return p[x] != null ? p[x] : ''; }) : s; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function eurC(c) { return c == null ? '—' : new Intl.NumberFormat(LOC[lang()], { style: 'currency', currency: 'EUR' }).format(c / 100); }
  /* C205 (V44) : une estimation s’écrit à l’euro, jamais au centime */
  function eur0(c) { return c == null ? '—' : new Intl.NumberFormat(LOC[lang()], { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(Math.round(c / 100)); }
  function db() { return (typeof W.DB === 'object' && W.DB) ? W.DB : null; }
  function jour() { try { var k = W.verdictOperationalClock().key; if (/^\d{4}-\d{2}-\d{2}/.test(k)) return k.slice(0, 10); } catch (e) {} var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function dateLabel(d) { try { return new Intl.DateTimeFormat(LOC[lang()], { day: 'numeric', month: 'long' }).format(new Date(d + 'T12:00:00')); } catch (e) { return d; } }
  function moisLabel(ym) { try { return new Intl.DateTimeFormat(LOC[lang()], { month: 'long', year: 'numeric' }).format(new Date(ym + '-15T12:00:00')); } catch (e) { return ym; } }
  function heure(iso) { try { return new Intl.DateTimeFormat(LOC[lang()], { hour: '2-digit', minute: '2-digit' }).format(new Date(iso)); } catch (e) { return ''; } }
  function readAmount(v) {
    var n = typeof W.verdictReadNumber === 'function' ? W.verdictReadNumber(v, false) : (typeof W.num === 'function' ? W.num(v) : null);
    return n === null || !isFinite(n) ? null : Math.round(n * 100);
  }
  function demoSession() { try { return !!(W.VERDICT_DEMO_SESSION || W.VERDICT_DEMO_RESTORE_ACTIVE); } catch (e) { return false; } }

  /* ---------------- données ---------------- */
  function decls() { var D = db(); if (!D) return []; if (!Array.isArray(D.caisseDecl)) D.caisseDecl = []; return D.caisseDecl; }
  function syncDay(date) {
    var D = db(); if (!D) return 'nodb';
    if (!Array.isArray(D.caisseAjust)) D.caisseAjust = [];
    var list = D.caisseAjust, idx = -1;
    for (var i = 0; i < list.length; i++) if (list[i] && list[i].date === date) { idx = i; break; }
    var cur = idx >= 0 ? list[idx] : null;
    if (cur && cur.source !== 'declaration' && cur.source !== 'demo+declaration' && !cur.fictional) return 'import';
    var base = cur && (cur.source === 'demo+declaration') ? cur.base : (cur && cur.fictional ? { remises: cur.remises, offerts: cur.offerts, annulations: cur.annulations } : null);
    var act = decls().filter(function (x) { return x.date === date && !x.annuleAt && DECL.indexOf(x.type) >= 0; });
    var tot = { offerts: null, remises: null, annulations: null };
    act.forEach(function (x) { tot[x.type] = (tot[x.type] || 0) + x.cents; });
    if (!act.length && !base) { if (idx >= 0) list.splice(idx, 1); return 'ok'; }
    var e = { date: date };
    TYPES.forEach(function (k) {
      var b = base && typeof base[k] === 'number' ? Math.round(base[k] * 100) : null;
      e[k] = (b == null && tot[k] == null) ? null : ((b || 0) + (tot[k] || 0)) / 100;
    });
    if (base) { e.base = base; e.source = 'demo+declaration'; e.demo = true; e.fictional = true; } else e.source = 'declaration';
    if (idx >= 0) list[idx] = e; else { list.push(e); list.sort(function (a, b) { return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0); }); }
    return 'ok';
  }
  function persist(reason) { try { if (typeof W.save === 'function') W.save(reason); return true; } catch (e) { return false; } }

  var lastDecl = null;
  function declare(type, montant, motif, date) {
    if (!accesOfferts()) return { ok: false, msg: T('lockPro') };
    if (type === 'annulations') return { ok: false, msg: T('koAnnul') };
    if (DECL.indexOf(type) < 0) return { ok: false, msg: T('koMontant') };
    var c = readAmount(montant);
    if (c === null) return { ok: false, msg: T('koMontant') };
    if (c <= 0) return { ok: false, msg: T('koZero') };
    if (c > 1000000) return { ok: false, msg: T('koMax') };
    motif = MOTIFS.indexOf(motif) >= 0 ? motif : 'autre';
    date = date || jour();
    var now = Date.now(), sig = [type, c, motif, date].join('|');
    if (lastDecl && lastDecl.sig === sig && now - lastDecl.t < 3000) return { ok: false, msg: T('koDouble') };
    var D = db(); if (!D) return { ok: false, msg: T('koSave') };
    var snapDecl = JSON.stringify(D.caisseDecl || []), snapAjust = JSON.stringify(D.caisseAjust || []);
    try {
      decls().push({ id: 'off-' + now + '-' + Math.random().toString(36).slice(2, 8), date: date, type: type, cents: c, motif: motif, at: new Date(now).toISOString(), annuleAt: null });
      var r = syncDay(date);
      if (!persist('caisse-declaration')) throw new Error('save');
      lastDecl = { sig: sig, t: now };
      return { ok: true, msg: T('ok', { t: lang() === 'de' ? T('s_' + type) : T('s_' + type).toLowerCase(), v: eurC(c), d: dateLabel(date) }) + (r === 'import' ? ' ' + T('importPrime') : '') };
    } catch (e) {
      D.caisseDecl = JSON.parse(snapDecl); D.caisseAjust = JSON.parse(snapAjust);
      return { ok: false, msg: T('koSave') };
    }
  }
  function cancel(id) {
    var D = db(); if (!D) return { ok: false, msg: T('koSave') };
    var x = decls().filter(function (d) { return d.id === id; })[0];
    if (!x || x.annuleAt) return { ok: false, msg: T('koSave') };
    var snapDecl = JSON.stringify(D.caisseDecl || []), snapAjust = JSON.stringify(D.caisseAjust || []);
    try { x.annuleAt = new Date().toISOString(); syncDay(x.date); if (!persist('caisse-declaration-annulee')) throw new Error('save'); return { ok: true, msg: T('okAnnule') }; }
    catch (e) { D.caisseDecl = JSON.parse(snapDecl); D.caisseAjust = JSON.parse(snapAjust); return { ok: false, msg: T('koSave') }; }
  }
  function setEnvelope(v) {
    var D = db(); if (!D) return { ok: false, msg: T('koSave') };
    if (v === '' || v == null) { var old = D.offertsEnveloppe; delete D.offertsEnveloppe; if (!persist('enveloppe-offerts')) { D.offertsEnveloppe = old; return { ok: false, msg: T('koSave') }; } return { ok: true, msg: T('envRetiree') }; }
    var c = readAmount(v);
    if (c === null || c <= 0 || c > 100000000) return { ok: false, msg: T('envKo') };
    var prev = D.offertsEnveloppe; D.offertsEnveloppe = c;
    if (!persist('enveloppe-offerts')) { D.offertsEnveloppe = prev; return { ok: false, msg: T('koSave') }; }
    return { ok: true, msg: T('envOk') };
  }

  /* ---------------- calcul de la jauge (centimes entiers, aucun flottant cumulé) ---------------- */
  function zoneOf(ratio) { return ratio <= 0.9 ? 'vert' : (ratio <= 1 ? 'jaune' : (ratio <= 1.1 ? 'orange' : 'rouge')); }
  function state(dateRef) {
    var D = db(), d = dateRef || jour(), ym = d.slice(0, 7);
    var S = { ym: ym, date: d, offerts: null, remises: null, annulations: null, caCents: null, env: null };
    if (!D) return S;
    (D.caisseAjust || []).forEach(function (x) {
      if (!x || String(x.date).slice(0, 7) !== ym || String(x.date) > d) return;
      TYPES.forEach(function (k) { if (typeof x[k] === 'number' && isFinite(x[k])) S[k] = (S[k] || 0) + Math.round(x[k] * 100); });
    });
    (D.histJour || []).forEach(function (x) {
      if (!x || String(x.date).slice(0, 7) !== ym || String(x.date) > d) return;
      if (typeof x.caJ === 'number' && isFinite(x.caJ)) S.caCents = (S.caCents || 0) + Math.round(x.caJ * 100);
    });
    S.gestes = (S.offerts == null && S.remises == null) ? null : (S.offerts || 0) + (S.remises || 0);
    S.pour100 = (S.gestes != null && S.caCents > 0) ? S.gestes / S.caCents * 100 : null;
    var dom = Number(d.slice(8, 10));
    S.projCents = (S.gestes != null && dom > 0) ? Math.round(S.gestes / dom * 365) : null;
    if (typeof D.offertsEnveloppe === 'number' && D.offertsEnveloppe > 0) {
      S.env = D.offertsEnveloppe;
      if (S.gestes != null) { S.ratio = S.gestes / S.env; S.zone = zoneOf(S.ratio); }
      else { S.ratio = 0; S.zone = 'vert'; }
    }
    S.journal = decls().filter(function (x) { return x.date === d; }).slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    return S;
  }

  /* ---------------- rendu de la carte ---------------- */
  var CSS = '#vdOffCard{grid-column:1/-1;min-width:0;margin:16px 0;padding:16px;border:1px solid rgba(148,163,184,.35);border-radius:16px;font-size:15px;line-height:1.45}' +
    '#vdOffCard h3{margin:0 0 2px;font-size:18px}#vdOffCard .vo-sub{margin:0 0 12px;opacity:.8;font-size:13px}' +
    '#vdOffCard .vo-row{display:flex;justify-content:space-between;gap:10px;padding:4px 0}#vdOffCard .vo-row b{font-variant-numeric:tabular-nums}' +
    '#vdOffCard .vo-track{height:12px;border-radius:999px;background:rgba(148,163,184,.25);overflow:hidden;margin:8px 0 4px}#vdOffCard .vo-track i{display:block;height:100%;border-radius:999px}' +
    '#vdOffCard .vo-z{font-weight:700}#vdOffCard .vo-small{font-size:13px;opacity:.85;margin:4px 0}' +
    '#vdOffCard .vo-btns{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 4px}#vdOffCard button{min-height:44px;padding:8px 14px;border-radius:12px;border:1px solid rgba(148,163,184,.55);background:transparent;color:inherit;font:inherit;font-weight:600;cursor:pointer}' +
    '#vdOffCard button.vo-prim{background:#15803d;border-color:#15803d;color:#fff}#vdOffCard button:disabled{opacity:.5;cursor:default}#vdOffCard button:focus-visible,#vdOffCard input:focus-visible,#vdOffCard select:focus-visible{outline:3px solid #22c55e;outline-offset:2px}' +
    '#vdOffCard form{display:grid;gap:8px;margin:10px 0;padding:12px;border-radius:12px;border:1px dashed rgba(148,163,184,.55)}#vdOffCard label{font-size:13px;font-weight:600}' +
    '#vdOffCard input,#vdOffCard select{min-height:44px;padding:8px 10px;border-radius:10px;border:1px solid rgba(148,163,184,.6);background:transparent;color:inherit;font:inherit;width:100%;box-sizing:border-box}' +
    '#vdOffCard select option{color:#14202b}#vdOffCard .vo-msg{min-height:1.2em;margin:6px 0;font-weight:600}#vdOffCard ul{list-style:none;padding:0;margin:6px 0}' +
    '#vdOffCard li{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid rgba(148,163,184,.25)}#vdOffCard li.vo-x span{text-decoration:line-through;opacity:.6}' +
    '#vdOffCard .vo-note{font-size:12.5px;opacity:.8;margin:10px 0 0}';
  function cardHTML(S, ui) {
    var h = '<h3 id="vdOffTitle">' + esc(T('titre')) + '</h3><p class="vo-sub">' + esc(T('mois', { m: moisLabel(S.ym) })) + '</p>';
    h += '<div class="vo-row"><span>' + esc(T('gestes')) + '</span><b data-vo="gestes">' + (S.gestes == null ? esc(T('nonDecl')) : esc(eurC(S.gestes))) + '</b></div>';
    if (S.env) {
      var pct = Math.min(100, S.ratio * 100), z = S.zone;
      h += '<div class="vo-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct.toFixed(0) + '" aria-label="' + esc(T('gestes')) + '"><i style="width:' + pct + '%;background:' + COL[z] + '"></i></div>';
      h += '<p class="vo-small"><span class="vo-z" data-vo-zone="' + z + '" style="color:' + COL[z] + '">● ' + esc(T('z_' + z)) + '</span> · ' + esc(T('jauge', { z: '', a: eurC(S.gestes || 0), b: eurC(S.env) }).replace(/^ · /, '')) + '</p>';
    } else h += '<p class="vo-small" data-vo-zone="none">' + esc(S.gestes == null ? T('rien') : T('envAucune')) + '</p>';
    TYPES.forEach(function (k) { var absent = k === 'annulations' ? T('annulAbsent') : T('nonDecl'); h += '<div class="vo-row" data-vo-line="' + k + '"><span>' + esc(T(k)) + '</span><b>' + (S[k] == null ? '<span style="font-weight:500;opacity:.75">' + esc(absent) + '</span>' : esc(eurC(S[k]))) + '</b></div>'; });
    /* C218 (W81) : « lues dans votre caisse » seulement quand une caisse les a vraiment données. */
    h += '<p class="vo-small" data-vo="annul-source">' + esc(T(S.annulations == null ? 'annulSans' : 'annulCaisse')) + '</p>';
    if (S.annulations == null && typeof W.verdictCaisseAjustPickIn === 'function') h += '<div class="vo-btns" style="margin-top:4px"><button type="button" data-vo-import="1">' + esc(T('importCaisse')) + '</button></div>';
    if (S.pour100 != null) h += '<p class="vo-small" data-vo="pour100">' + esc(T('pour100', { v: eurC(Math.round(S.pour100 * 100)) })) + '</p>';
    if (S.projCents != null) h += '<p class="vo-small" data-vo="proj">' + esc(T('proj', { v: eur0(S.projCents) })) + '</p>';
    h += '<div class="vo-btns">' + DECL.map(function (k) { return '<button type="button" data-vo-add="' + k + '">' + esc(T('add_' + k)) + '</button>'; }).join('') + '</div>';
    if (ui.form) {
      h += '<form data-vo-form="' + ui.form + '" novalidate><label for="voAmount">' + esc(T('montant')) + '</label><input id="voAmount" inputmode="decimal" autocomplete="off" value="' + esc(ui.amount || '') + '">' +
        '<label for="voMotif">' + esc(T('motif')) + '</label><select id="voMotif">' + MOTIFS.map(function (m) { return '<option value="' + m + '"' + (ui.motif === m ? ' selected' : '') + '>' + esc(T('m_' + m)) + '</option>'; }).join('') + '</select>' +
        '<div class="vo-btns" style="margin:4px 0 0"><button type="submit" class="vo-prim" data-vo-save="1">' + esc(T('enregistrer')) + '</button><button type="button" data-vo-close="1">' + esc(T('fermer')) + '</button></div></form>';
    }
    h += '<p class="vo-msg" role="status" aria-live="polite" data-vo-msg="' + (ui.msgOk ? 'ok' : (ui.msg ? 'ko' : '')) + '">' + esc(ui.msg || '') + '</p>';
    h += '<p class="vo-small" style="font-weight:600;margin-top:10px">' + esc(T('journal', { d: dateLabel(S.date) })) + '</p>';
    if (!S.journal.length) h += '<p class="vo-small">' + esc(T('journalVide')) + '</p>';
    else h += '<ul>' + S.journal.map(function (x) { return '<li class="' + (x.annuleAt ? 'vo-x' : '') + '" data-vo-id="' + esc(x.id) + '"><span>' + esc(T('s_' + x.type)) + ' · ' + esc(eurC(x.cents)) + ' · ' + esc(T('m_' + x.motif)) + ' · ' + esc(heure(x.at)) + '</span>' + (x.annuleAt ? '<small>' + esc(T('annuleLe', { h: heure(x.annuleAt) })) + '</small>' : '<button type="button" data-vo-cancel="' + esc(x.id) + '">' + esc(T('annuler')) + '</button>') + '</li>'; }).join('') + '</ul>';
    if (ui.envForm) h += '<form data-vo-envform="1" novalidate><label for="voEnv">' + esc(T('envLabel')) + '</label><input id="voEnv" inputmode="decimal" autocomplete="off" value="' + esc(S.env ? (S.env / 100).toString().replace('.', ',') : '') + '"><div class="vo-btns" style="margin:4px 0 0"><button type="submit" class="vo-prim">' + esc(T('enregistrer')) + '</button>' + (S.env ? '<button type="button" data-vo-envdel="1">' + esc(T('envRetirer')) + '</button>' : '') + '<button type="button" data-vo-envclose="1">' + esc(T('fermer')) + '</button></div></form>';
    else h += '<div class="vo-btns"><button type="button" data-vo-env="1">' + esc(S.env ? T('env', { v: eurC(S.env) }) : T('envFixer')) + '</button></div>';
    h += '<p class="vo-note">' + esc(T('note')) + (demoSession() ? ' ' + esc(T('demo')) : '') + '</p>';
    return h;
  }
  /* V2-A4 · grille 05/10 : offerts et remises sont Pro. Le niveau est lu dans l'app (VerdictOffre), jamais deviné. */
  function niveau() { try { return W.VerdictOffre && typeof W.VerdictOffre.niveau === 'function' ? W.VerdictOffre.niveau() : 'pro'; } catch (e) { return 'pro'; } }
  function accesOfferts() { try { return !W.VerdictOffre || W.VerdictOffre.acces('offerts', niveau()); } catch (e) { return true; } }
  function render(doc, card) {
    card.__lvl = niveau();
    if (!accesOfferts()) {
      card.innerHTML = '<h3 id="vdOffTitle">' + esc(T('titre')) + '</h3><p class="vo-small" data-vo-lock="offerts">' + esc(T('lockPro')) + '</p>' +
        '<div class="vo-btns"><button type="button" data-vo-offres="1">' + esc(T('lockBtn')) + '</button></div>';
      return;
    }
    var ui = card.__vo || (card.__vo = {});
    var keepFocus = doc.activeElement && card.contains(doc.activeElement) ? doc.activeElement.id : null;
    card.innerHTML = cardHTML(state(), ui);
    if (keepFocus) { var f = doc.getElementById(keepFocus); if (f) f.focus(); }
  }
  function bind(doc, card) {
    card.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('button') : null; if (!t || t.disabled) return;
      if (t.hasAttribute('data-vo-offres')) { try { W.go('abo'); } catch (x) {} return; }
      if (!accesOfferts()) return;
      var ui = card.__vo;
      if (t.getAttribute('data-vo-add')) { ui.form = t.getAttribute('data-vo-add'); ui.amount = ''; ui.motif = 'fidele'; ui.msg = ''; render(doc, card); var a = doc.getElementById('voAmount'); if (a) a.focus(); return; }
      if (t.hasAttribute('data-vo-close')) { ui.form = null; ui.msg = ''; render(doc, card); return; }
      if (t.getAttribute('data-vo-cancel')) { t.disabled = true; var r = cancel(t.getAttribute('data-vo-cancel')); ui.msg = r.msg; ui.msgOk = r.ok; render(doc, card); return; }
      if (t.hasAttribute('data-vo-import')) { try { W.verdictCaisseAjustPickIn(doc, doc.defaultView); } catch (x) {} return; }
      if (t.hasAttribute('data-vo-env')) { ui.envForm = true; ui.msg = ''; render(doc, card); var v = doc.getElementById('voEnv'); if (v) v.focus(); return; }
      if (t.hasAttribute('data-vo-envclose')) { ui.envForm = false; render(doc, card); return; }
      if (t.hasAttribute('data-vo-envdel')) { var r2 = setEnvelope(''); ui.msg = r2.msg; ui.msgOk = r2.ok; if (r2.ok) ui.envForm = false; render(doc, card); return; }
    });
    card.addEventListener('submit', function (e) {
      e.preventDefault(); if (!accesOfferts()) return; var form = e.target, ui = card.__vo;
      form.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
      if (form.hasAttribute('data-vo-envform')) { var r = setEnvelope(doc.getElementById('voEnv').value); ui.msg = r.msg; ui.msgOk = r.ok; if (r.ok) ui.envForm = false; render(doc, card); return; }
      var amount = doc.getElementById('voAmount').value, motif = doc.getElementById('voMotif').value;
      var res = declare(form.getAttribute('data-vo-form'), amount, motif, jour());
      ui.msg = res.msg; ui.msgOk = res.ok;
      if (res.ok) { ui.form = null; ui.amount = ''; } else { ui.amount = amount; ui.motif = motif; }
      render(doc, card);
    });
  }
  function ensure(doc) {
    if (!doc || !doc.body) return;
    /* R316 : ancrage sur le module du jour (#modSaisie), présent que la journée soit ouverte, fermée ou à vérifier. */
    var M = doc.getElementById('modSaisie');
    if (!M) { var form = doc.getElementById('dayEntryForm'); M = form && form.parentElement; }
    if (!M || !M.parentNode) return;
    var card = doc.getElementById('vdOffCard');
    if (!doc.getElementById('vdOffCss')) { var st = doc.createElement('style'); st.id = 'vdOffCss'; st.textContent = CSS; (doc.head || doc.body).appendChild(st); }
    /* C132 : rangée dans un tiroir de l’Accueil en chapitres (accueil-chapitres-a40), elle y reste. */
    if (card && (card.previousElementSibling === M || (card.parentElement && card.parentElement.classList.contains('vx40-t')))) { if (card.__lvl !== niveau()) render(doc, card); return; }
    if (!card) { card = doc.createElement('section'); card.id = 'vdOffCard'; card.setAttribute('aria-labelledby', 'vdOffTitle'); bind(doc, card); }
    M.parentNode.insertBefore(card, M.nextSibling);
    render(doc, card);
  }
  function hook(frame) {
    try {
      var doc = frame.contentDocument; if (!doc || doc.__vdOffHook) return; doc.__vdOffHook = true;
      var pend = false, go = function () { if (pend) return; pend = true; (doc.defaultView || W).requestAnimationFrame(function () { pend = false; try { ensure(doc); } catch (e) {} }); };
      new (doc.defaultView || W).MutationObserver(go).observe(doc.body || doc.documentElement, { childList: true, subtree: true });
      go();
    } catch (e) {}
  }
  function scan() { document.querySelectorAll('iframe.p41-ecran').forEach(hook); }
  document.addEventListener('load', function (e) { if (e.target && e.target.tagName === 'IFRAME') { try { e.target.contentDocument.__vdOffHook = false; } catch (x) {} hook(e.target); } }, true);
  var pendTop = false;
  new MutationObserver(function () { if (pendTop) return; pendTop = true; requestAnimationFrame(function () { pendTop = false; scan(); }); }).observe(document.documentElement, { childList: true, subtree: true });
  scan();
  document.addEventListener('verdict:niveau', function () { document.querySelectorAll('iframe.p41-ecran').forEach(function (f) { try { var d = f.contentDocument, c = d && d.getElementById('vdOffCard'); if (c) render(d, c); } catch (e) {} }); });
  W.VerdictOfferts = { declare: declare, cancel: cancel, setEnvelope: setEnvelope, state: state, syncDay: syncDay, version: 'R317' };
})();
