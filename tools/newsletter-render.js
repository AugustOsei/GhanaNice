/* Renders the monthly newsletter, "What's on in Ghana", from one issue's data
   (tools/newsletter/<yyyy-mm>.json). Shared by two callers, so both always produce the same
   bytes:
   - tools/build_newsletter.mjs, which writes /newsletter/ and the issue pages (and is run with
     --check by tools/smoke.mjs);
   - the n8n issue workflow (n8n/build_newsletter_issue_workflow.py pastes this file into its Code
     nodes), which drafts the email and, once August has sent it, commits the issue page.
   Plain script, no imports: it defines one global, GhanaNiceNewsletter. All issue text is plain
   text and is escaped here; URLs are root-relative site paths. */
var GhanaNiceNewsletter = (function () {
  var SITE = 'https://www.ghananice.com';
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function monthName(month) {
    var parts = month.split('-');
    return MONTHS[Number(parts[1]) - 1] + ' ' + parts[0];
  }
  function issuePath(month) { return '/newsletter/' + month + '/'; }
  function absolute(url) { return /^https?:/.test(url) ? url : SITE + url; }

  /* The plain-page template (tools/page-template.html), filled the way tools/build_pages.mjs fills it. */
  function fill(template, meta, content) {
    return template.replace(/<!-- Template for[\s\S]*?-->\n/, '').replace(/\{\{(\w+)\}\}/g, function (match, key) {
      if (key === 'content') return content;
      if (key === 'url') return esc(SITE + meta.path);
      if (key in meta) return esc(meta[key]);
      throw new Error('page-template.html: no value for ' + match);
    });
  }

  function itemHtml(item) {
    var title = item.url ? '<a href="' + esc(item.url) + '">' + esc(item.title) + '</a>' : esc(item.title);
    return '        <li class="nl-item">' +
      (item.meta ? '<span class="nl-item-meta">' + esc(item.meta) + '</span>' : '') +
      '<h3>' + title + '</h3>' +
      (item.text ? '<p>' + esc(item.text) + '</p>' : '') + '</li>';
  }
  function sectionHtml(section) {
    var body = section.items && section.items.length
      ? '      <ul class="nl-items">\n' + section.items.map(itemHtml).join('\n') + '\n      </ul>'
      : '      <p>' + esc(section.empty || '') + '</p>';
    return '    <section class="nl-section" aria-labelledby="nl-' + esc(section.id) + '">\n' +
      '      <h2 id="nl-' + esc(section.id) + '">' + esc(section.title) + '</h2>\n' + body +
      (section.note ? '\n      <p class="nl-section-note">' + esc(section.note) + '</p>' : '') + '\n    </section>';
  }

  function issuePage(issue, template) {
    var name = monthName(issue.month);
    var content = [
      '    <p class="doc-eyebrow"><a href="/newsletter/">What’s on in Ghana</a></p>',
      '    <h1>' + esc(name) + '. <em>' + esc(issue.headline || 'What’s on in Ghana this month.') + '</em></h1>',
      '    <p class="info-updated">Sent ' + esc(issue.sentOn || name) + '</p>',
      '    <p class="info-lead">' + esc(issue.intro) + '</p>',
      issue.sections.map(sectionHtml).join('\n\n'),
      '    <p class="nl-more"><a href="/newsletter/">← All issues</a></p>',
      '    <section class="nl-band nl-page-band" aria-label="Newsletter sign-up" data-newsletter="newsletter"></section>'
    ].join('\n');
    return fill(template, {
      path: issuePath(issue.month),
      title: 'What’s on in Ghana: ' + name + ' · GhanaNice',
      description: issue.preheader || issue.intro
    }, content);
  }

  /* What the archive needs to know about each issue, kept in dist/data/newsletter-issues.json so
     the workflow can rebuild the archive (and avoid repeating a place or tip) without the
     full issue files. */
  function summary(issue) {
    return { month: issue.month, title: monthName(issue.month), url: issuePath(issue.month), headline: issue.headline || '', intro: issue.intro, used: issue.used || {} };
  }

  function archivePage(summaries, template) {
    var list = summaries.length
      ? '    <ul class="info-list nl-archive">\n' + summaries.map(function (s) {
          return '      <li><a class="info-inline" href="' + esc(s.url) + '"><strong>' + esc(s.title) + '</strong></a>' +
            (s.headline ? ' · ' + esc(s.headline) : '') + '</li>';
        }).join('\n') + '\n    </ul>'
      : '    <p>No issues yet. Sign up above and the first one comes straight to you.</p>';
    var content = [
      '    <p class="doc-eyebrow">Newsletter</p>',
      '    <h1>What’s on in Ghana. <em>One email a month.</em></h1>',
      '    <p class="info-lead">Near the end of each month: the festivals coming up next month, what’s new on GhanaNice, one place worth the trip and a tip from a reader. Every issue is also published here.</p>',
      '    <section class="nl-band nl-page-band" aria-label="Newsletter sign-up" data-newsletter="newsletter"></section>',
      '    <h2>Past issues</h2>',
      list
    ].join('\n');
    return fill(template, {
      path: '/newsletter/',
      title: 'What’s on in Ghana: the GhanaNice newsletter',
      description: 'A monthly email from GhanaNice: next month’s festivals, new places, one place worth the trip and a tip from a reader. Read past issues here.'
    }, content);
  }

  /* The sitemap entries for the newsletter, in the order tools/build_regions.mjs writes them. */
  function sitemapUrls(summaries) {
    return [SITE + '/newsletter/'].concat(summaries.slice().sort(function (a, b) { return a.month < b.month ? -1 : 1; })
      .map(function (s) { return SITE + s.url; }));
  }

  /* The issue as email, laid out to paste into MailerLite's editor: plain HTML with inline
     styles and absolute links. */
  function emailHtml(issue) {
    var font = 'font-family:Arial,Helvetica,sans-serif;';
    var serif = 'font-family:Georgia,\'Times New Roman\',serif;';
    var out = ['<div style="max-width:620px;' + serif + 'color:#11110f;font-size:16px;line-height:1.5">',
      '<p style="' + font + 'font-size:11px;font-weight:bold;letter-spacing:.12em;text-transform:uppercase;color:#df4a32;margin:0 0 8px">What’s on in Ghana · ' + esc(monthName(issue.month)) + '</p>',
      '<h1 style="' + font + 'font-size:30px;line-height:1.05;margin:0 0 14px">' + esc(issue.headline || 'What’s on in Ghana this month.') + '</h1>',
      '<p style="margin:0 0 22px">' + esc(issue.intro) + '</p>'];
    issue.sections.forEach(function (section) {
      out.push('<h2 style="' + font + 'font-size:20px;margin:28px 0 10px;padding-top:14px;border-top:2px solid #11110f">' + esc(section.title) + '</h2>');
      if (!section.items || !section.items.length) out.push('<p style="margin:0 0 12px">' + esc(section.empty || '') + '</p>');
      (section.items || []).forEach(function (item) {
        out.push('<p style="margin:0 0 14px">' +
          (item.meta ? '<span style="' + font + 'font-size:11px;font-weight:bold;letter-spacing:.08em;text-transform:uppercase;color:#5c5b55">' + esc(item.meta) + '</span><br>' : '') +
          '<strong style="' + font + 'font-size:17px">' + (item.url ? '<a href="' + esc(absolute(item.url)) + '" style="color:#11110f">' + esc(item.title) + '</a>' : esc(item.title)) + '</strong>' +
          (item.text ? '<br>' + esc(item.text) : '') + '</p>');
      });
      if (section.note) out.push('<p style="margin:0 0 12px;font-size:14px;color:#5c5b55">' + esc(section.note) + '</p>');
    });
    out.push('<p style="margin:28px 0 0;padding-top:14px;border-top:2px solid #11110f">Know a festival or a place we should add? Reply to this email, or <a href="' + SITE + '/#tip" style="color:#11110f">share it on GhanaNice</a>.</p>');
    out.push('<p style="margin:10px 0 0;font-size:14px;color:#5c5b55">Read this issue on the site: <a href="' + SITE + issuePath(issue.month) + '" style="color:#5c5b55">' + SITE.replace('https://', '') + issuePath(issue.month) + '</a></p>');
    out.push('</div>');
    return out.join('\n');
  }

  return { SITE: SITE, MONTHS: MONTHS, esc: esc, monthName: monthName, issuePath: issuePath, issuePage: issuePage, archivePage: archivePage, summary: summary, sitemapUrls: sitemapUrls, emailHtml: emailHtml };
})();
if (typeof module !== 'undefined') module.exports = GhanaNiceNewsletter;
