/* Progressive enhancement: søgning, emnefilter og tema-toggle.
   Alt indhold og al navigation virker uden denne fil; den tilføjer kun lag
   ovenpå. Ingen frameworks, ingen eksterne kald ud over artikler.json. */

(function () {
  "use strict";

  /* Sider i undermapper sætter data-rod=".." på <html>, så stier kan løses
     relativt uden hardcodet domæne. */
  var rod = document.documentElement.getAttribute("data-rod") || ".";

  /* --- Tema-toggle (valgfri, uden flicker: se inline-script i <head>) --- */
  var temaKnap = document.querySelector(".tema-knap");
  if (temaKnap) {
    temaKnap.hidden = false;
    temaKnap.addEventListener("click", function () {
      var html = document.documentElement;
      var erMoerk = html.dataset.tema
        ? html.dataset.tema === "moerk"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
      var nyt = erMoerk ? "lys" : "moerk";
      html.dataset.tema = nyt;
      try {
        localStorage.setItem("tema", nyt);
      } catch (e) {
        /* localStorage kan være blokeret; temaet gælder så kun denne side */
      }
    });
  }

  /* --- Erklærings-ribbon: luk ved klik udenfor eller Escape --- */
  var erklaering = document.querySelector(".erklaering");
  if (erklaering) {
    document.addEventListener("click", function (e) {
      if (erklaering.open && !erklaering.contains(e.target)) erklaering.open = false;
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && erklaering.open) erklaering.open = false;
    });
  }

  /* --- Manifestet hentes én gang og driver både søgning og emnefilter --- */
  fetch(rod + "/assets/data/artikler.json")
    .then(function (svar) {
      if (!svar.ok) throw new Error("HTTP " + svar.status);
      return svar.json();
    })
    .then(function (data) {
      aktiverSoegning(data.artikler);
      aktiverEmnefilter(data.artikler);
    })
    .catch(function () {
      /* Kan manifestet ikke hentes, forbliver søgefelt og filter skjult;
         arkivsiden er fallback. */
    });

  /* --- Søgning: titel, resumé og emner (ikke fuldtekst) --- */
  function aktiverSoegning(artikler) {
    var form = document.querySelector(".soegning");
    var panel = document.querySelector(".soegeresultater");
    if (!form || !panel) return;
    var felt = form.querySelector("input[type=search]");
    form.hidden = false;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
    });
    felt.addEventListener("input", function () {
      visResultater(felt.value);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) {
        felt.value = "";
        visResultater("");
      }
    });

    function visResultater(tekst) {
      var soeg = tekst.trim().toLowerCase();
      if (soeg.length < 2) {
        panel.hidden = true;
        panel.textContent = "";
        return;
      }
      var ord = soeg.split(/\s+/);
      var fund = artikler.filter(function (a) {
        var hoestak = (a.titel + " " + a.resume + " " + a.emner.join(" ")).toLowerCase();
        return ord.every(function (o) {
          return hoestak.indexOf(o) !== -1;
        });
      });

      panel.textContent = "";
      var rubrik = document.createElement("p");
      rubrik.className = "soegeresultater-rubrik meta";
      rubrik.textContent =
        fund.length === 0
          ? "Ingen resultater for “" + tekst.trim() + "”"
          : fund.length + (fund.length === 1 ? " resultat" : " resultater");
      panel.appendChild(rubrik);

      if (fund.length > 0) {
        var liste = document.createElement("ol");
        liste.className = "artikelliste";
        fund.forEach(function (a) {
          liste.appendChild(lavPunkt(a));
        });
        panel.appendChild(liste);
      }
      panel.hidden = false;
    }

    /* Udfyldes feltet via ?q= (no-JS-fallbackens formål), søges der straks */
    var m = window.location.search.match(/[?&]q=([^&]*)/);
    if (m && m[1]) {
      var vaerdi = decodeURIComponent(m[1].replace(/\+/g, " "));
      felt.value = vaerdi;
      visResultater(vaerdi);
    }
  }

  /* Søgeresultater genbruger artikellistens udtryk fra forside og arkiv */
  function lavPunkt(a) {
    var li = document.createElement("li");
    li.className = "artikelpunkt";

    var titel = document.createElement("h3");
    titel.className = "artikelpunkt-titel";
    var link = document.createElement("a");
    link.href = rod + "/" + a.sti;
    link.textContent = a.titel;
    titel.appendChild(link);
    li.appendChild(titel);

    var resume = document.createElement("p");
    resume.className = "artikelpunkt-resume";
    resume.textContent = a.resume;
    li.appendChild(resume);

    var meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent =
      formaterDato(a.dato) +
      " · " +
      a.laesetidMin +
      " min. læsning · " +
      a.emner.join(" · ");
    li.appendChild(meta);

    return li;
  }

  function formaterDato(iso) {
    var maaneder = [
      "januar", "februar", "marts", "april", "maj", "juni",
      "juli", "august", "september", "oktober", "november", "december"
    ];
    var dele = iso.split("-");
    return (
      parseInt(dele[2], 10) + ". " + maaneder[parseInt(dele[1], 10) - 1] + " " + dele[0]
    );
  }

  /* --- Emnefilter på arkivsiden. Uden JS: skjult, og alle artikler vises --- */
  function aktiverEmnefilter(artikler) {
    var filter = document.querySelector(".filter");
    if (!filter) return;
    var liste = filter.querySelector(".filter-liste");
    if (!liste) return;

    var emner = [];
    artikler.forEach(function (a) {
      a.emner.forEach(function (e) {
        if (emner.indexOf(e) === -1) emner.push(e);
      });
    });
    emner.sort(function (a, b) {
      return a.localeCompare(b, "da");
    });

    var knapper = [];

    function lavKnap(navn, emne) {
      var li = document.createElement("li");
      var knap = document.createElement("button");
      knap.type = "button";
      knap.className = "filter-knap";
      knap.textContent = navn;
      knap.setAttribute("aria-pressed", emne === "" ? "true" : "false");
      knap.addEventListener("click", function () {
        vaelg(emne, knap);
      });
      li.appendChild(knap);
      liste.appendChild(li);
      knapper.push(knap);
    }

    lavKnap("Alle", "");
    emner.forEach(function (e) {
      lavKnap(e, e);
    });

    function vaelg(emne, aktivKnap) {
      knapper.forEach(function (k) {
        k.setAttribute("aria-pressed", k === aktivKnap ? "true" : "false");
      });
      /* Punkter uden data-emner (fx "Kommer"-dele) skjules, når der filtreres */
      document.querySelectorAll("main .artikelpunkt").forEach(function (li) {
        if (emne === "") {
          li.hidden = false;
          return;
        }
        var liEmner = (li.getAttribute("data-emner") || "").toLowerCase().split(",");
        li.hidden = liEmner.indexOf(emne.toLowerCase()) === -1;
      });
    }

    filter.hidden = false;
  }
})();
