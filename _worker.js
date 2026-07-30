const ENGLISH_CSS = String.raw`
html[lang="en"]{--font-en:"Titillium Web",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
html[lang="en"] body,html[lang="en"] p,html[lang="en"] h1,html[lang="en"] h2,html[lang="en"] h3,html[lang="en"] h4,html[lang="en"] h5,html[lang="en"] h6,html[lang="en"] a,html[lang="en"] span,html[lang="en"] button,html[lang="en"] input,html[lang="en"] textarea,html[lang="en"] select,html[lang="en"] li,html[lang="en"] td,html[lang="en"] th{font-family:var(--font-en)!important}
html[lang="en"] body{font-size:16px;line-height:1.58;font-weight:400;text-align:left}
html[lang="en"] h1,html[lang="en"] h2,html[lang="en"] h3,html[lang="en"] h4{font-weight:600;letter-spacing:-.025em;overflow-wrap:normal!important;word-break:normal!important;hyphens:manual;text-wrap:balance}
html[lang="en"] p,html[lang="en"] li{overflow-wrap:break-word;word-break:normal}
html[lang="en"] .container,html[lang="en"] .hero-copy,html[lang="en"] .section-head>*,html[lang="en"] .page-hero-grid>*,html[lang="en"] .case-study>*,html[lang="en"] .cta-panel>*,html[lang="en"] .bento-card,html[lang="en"] .service-card,html[lang="en"] .portfolio-item,html[lang="en"] .timeline-step{min-width:0}
html[lang="en"] .hero h1,html[lang="en"] .hero-center h1{font-size:clamp(3rem,5.2vw,5.4rem)!important;line-height:.98!important;letter-spacing:-.045em!important;max-width:920px;margin-inline:auto;overflow-wrap:normal!important;word-break:normal!important}
html[lang="en"] .hero-center{width:min(100%,980px);padding-inline:24px}
html[lang="en"] .hero-center .hero-lead,html[lang="en"] .hero-lead{max-width:720px;font-size:clamp(1rem,1.35vw,1.18rem);line-height:1.6}
html[lang="en"] .section-head h2,html[lang="en"] .page-hero h1,html[lang="en"] .work-hero h1,html[lang="en"] main>section:first-of-type h1{font-size:clamp(2.35rem,4vw,4.25rem)!important;line-height:1.02!important;letter-spacing:-.04em!important;max-width:780px}
html[lang="en"] .section-head{grid-template-columns:minmax(0,1fr) minmax(280px,.72fr);align-items:end;gap:42px}
html[lang="en"] .section-head p,html[lang="en"] .page-hero p,html[lang="en"] .work-hero p{max-width:620px;line-height:1.62}
html[lang="en"] .section-head:has(>div:only-child){grid-template-columns:minmax(0,1fr)}
html[lang="en"] .section-head:has(>div:only-child) h2{max-width:860px}
html[lang="en"] .case-content h2,html[lang="en"] .manifesto-main h2,html[lang="en"] .cta-panel h2,html[lang="en"] .lead-magnet h2,html[lang="en"] .contact-info h2{font-size:clamp(2rem,3.7vw,3.85rem)!important;line-height:1.04!important;letter-spacing:-.035em!important}
html[lang="en"] .case-content{padding:clamp(30px,4vw,52px)}
html[lang="en"] .case-content p,html[lang="en"] .case-narrative-item p,html[lang="en"] .portfolio-item .caption p,html[lang="en"] .timeline-step p,html[lang="en"] .service-card p,html[lang="en"] .bento-card p{line-height:1.55}
html[lang="en"] .portfolio-item .caption b,html[lang="en"] .work-overlay h3,html[lang="en"] .service-card h3,html[lang="en"] .bento-card h3{line-height:1.18;text-wrap:balance}
html[lang="en"] .faq-q{text-align:left;line-height:1.35}
html[lang="en"] table th,html[lang="en"] table td{text-align:left}
html[dir="ltr"] .text-right{text-align:left!important}html[dir="ltr"] .text-left{text-align:right!important}
html[dir="ltr"] .ml-auto{margin-right:auto!important;margin-left:unset!important}html[dir="ltr"] .mr-auto{margin-left:auto!important;margin-right:unset!important}
html[lang="en"] .en-copy-fixed{max-width:72ch}
@media(max-width:1100px){html[lang="en"] .hero h1,html[lang="en"] .hero-center h1{font-size:clamp(3rem,8.4vw,5rem)!important;max-width:820px}html[lang="en"] .section-head,html[lang="en"] .page-hero-grid{grid-template-columns:1fr;align-items:start;gap:20px}html[lang="en"] .section-head h2,html[lang="en"] .page-hero h1,html[lang="en"] .work-hero h1{max-width:820px}}
@media(max-width:720px){html[lang="en"] body{font-size:15px}html[lang="en"] .hero{padding-top:118px}html[lang="en"] .hero-center{padding-inline:4px}html[lang="en"] .hero h1,html[lang="en"] .hero-center h1{font-size:clamp(2.55rem,11.5vw,3.65rem)!important;line-height:.99!important;letter-spacing:-.04em!important;max-width:100%}html[lang="en"] .section-head h2,html[lang="en"] .page-hero h1,html[lang="en"] .work-hero h1,html[lang="en"] main>section:first-of-type h1{font-size:clamp(2.05rem,9.2vw,3rem)!important;line-height:1.03!important;max-width:100%}html[lang="en"] .case-content h2,html[lang="en"] .manifesto-main h2,html[lang="en"] .cta-panel h2,html[lang="en"] .lead-magnet h2,html[lang="en"] .contact-info h2{font-size:clamp(1.9rem,8.3vw,2.65rem)!important}html[lang="en"] .section-head,html[lang="en"] .page-hero-grid{gap:16px}html[lang="en"] .section-head p,html[lang="en"] .page-hero p,html[lang="en"] .work-hero p,html[lang="en"] .hero-lead{font-size:.98rem;line-height:1.58}html[lang="en"] .case-content{padding:26px 22px}html[lang="en"] .portfolio-item .caption p{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}}
`;

const HOME = {
  heroTitle: 'We Turn Scattered Marketing Activity into a Complete Growth System',
  heroLead: 'Wisal Tech connects strategy, brand, content, technology, and performance into one practical system built to create measurable growth.',
  sections: [
    'The Problem Isn’t a Lack of Services. It’s the Lack of Connection Between Them.',
    'Three Core Capabilities. One Integrated Team.',
    'From Idea to Growth in Four Clear Steps.',
    'Everything You Need to Build a Real Digital Business.',
    'A Visual System That Communicates Value Before You Explain It.',
    'One Integrated System Instead of Multiple Vendors.',
    'We Start with the Right Problem — Not the Fastest Service.'
  ],
  stats: ['Years of combined experience','Specialist markets served','Integrated partner for growth'],
  problemTitles: ['A Fragmented Brand','Disconnected Channels','Activity Without Measurement'],
  problemDescriptions: [
    'Your visual identity, messages, and customer experience feel different from one channel to another.',
    'Website, social media, campaigns, and sales tools operate separately instead of supporting one journey.',
    'Work is being produced, but there is no clear link between activity, leads, and business growth.'
  ],
  bentoTitles: ['Brand Strategy & Identity','Performance & Digital Growth','Web Experiences','Content Systems','Technology & Automation'],
  bentoDescriptions: [
    'Build a clear position, a recognizable identity, and consistent brand touchpoints.',
    'Turn data, paid media, SEO, and conversion thinking into measurable commercial growth.',
    'Create fast, responsive websites and landing pages designed around user action.',
    'Develop repeatable content systems that keep your brand clear, useful, and consistent.',
    'Connect tools, workflows, ERP solutions, and automation to make operations easier to manage.'
  ],
  processTitles: ['Diagnose','Plan','Build','Measure & Improve'],
  processDescriptions: [
    'We study the business, audience, current assets, and the real constraint behind the problem.',
    'We define priorities, the customer journey, the message, the channels, and the delivery roadmap.',
    'Our specialists produce the brand, content, website, campaigns, or systems as one connected solution.',
    'We monitor performance, learn from real data, and improve what creates the strongest result.'
  ],
  ctaTitle: 'Start with the Right Business Problem',
  ctaText: 'Tell us what you are trying to achieve. We will recommend the clearest first step, without selling you services you do not need.'
};

const WORK = {
  heroTitle: 'Our Portfolio & Featured Work',
  heroLead: 'A selection of brand, design, digital, web, and production work created to help businesses present their value clearly and grow with confidence.',
  sections: [
    'A Complete Brand System — From Strategy to Every Touchpoint.',
    'Explore Our Work by Discipline.',
    'A Clear Process Behind Every Deliverable.',
    'What Our Clients Say.',
    'Frequently Asked Questions.'
  ],
  caseTitle: 'A Connected Identity System Built for Real Business Use',
  caseText: 'This concept shows how one clear visual system can move consistently across stationery, presentations, social media, printed material, and digital experiences.',
  filters: ['All','Branding','Websites','Marketing','Print','Systems'],
  portfolioTitles: [
    'Corporate Stationery System','Premium Brand Identity','Digital Campaign Toolkit','Social Media Design System','Product & Packaging Presentation','Company Brochure Design','Exhibition & Large-Format Display','Outdoor Advertising Campaign','Roll-Up & Event Branding'
  ],
  portfolioLabels: ['Systems','Branding','Marketing','Social Media','Presentation','Print','Exhibitions','Advertising','Branding'],
  portfolioDescriptions: [
    'A consistent set of professional business touchpoints designed for daily use.',
    'A refined identity direction with a confident, premium visual language.',
    'Campaign assets designed to communicate one offer clearly across digital channels.',
    'A flexible social media system that keeps content recognizable and easy to scale.',
    'A polished presentation approach that gives products stronger perceived value.',
    'A structured company brochure that turns complex services into a clear sales story.',
    'Large-format brand applications designed for visibility, clarity, and impact.',
    'Outdoor creative built around a focused message and immediate visual recognition.',
    'Event branding that carries the identity consistently across physical touchpoints.'
  ],
  processTitles: ['Discovery','Strategy','Design','Production','Launch','Measurement'],
  processDescriptions: [
    'We understand the audience, objective, context, and constraints before designing.',
    'We define the message, hierarchy, creative direction, and required deliverables.',
    'We translate the strategy into a clear, distinctive, and practical visual system.',
    'We prepare every asset carefully for its real digital or print environment.',
    'We deliver organized files and support a consistent, confident rollout.',
    'We review performance and feedback to improve the next stage of the work.'
  ],
  faqQuestions: ['Can you adapt the same visual system to different formats?','Do you provide editable source files?'],
  faqAnswers: [
    'Yes. We build flexible systems that can be adapted for social media, presentations, websites, campaigns, and print while preserving consistency.',
    'Yes. Source files are included according to the agreed scope, with organized exports for practical day-to-day use.'
  ]
};

const SERVICE_DETAILS = {
  '/en/services/branding/': {
    heroTitle:'Brand Strategy & Visual Identity',
    heroLead:'Build a brand that is clear, recognizable, and consistent across every customer touchpoint.',
    features:['Brand Strategy','Visual Identity','Brand Guidelines','Launch Assets']
  },
  '/en/services/digital-marketing/': {
    heroTitle:'Digital Marketing Built Around Measurable Growth',
    heroLead:'Connect paid media, content, social channels, and analytics through one focused growth plan.',
    features:['Campaign Strategy','Paid Media Management','Social Content','Analytics & Optimization']
  },
  '/en/services/erp/': {
    heroTitle:'ERP & Business Systems That Simplify Operations',
    heroLead:'Turn disconnected processes and data into one clear system your team can manage with confidence.',
    features:['Process Mapping','System Architecture','Role-Based Dashboards','Implementation & Support']
  },
  '/en/services/graphic-design/': {
    heroTitle:'Graphic Design That Makes Value Visible',
    heroLead:'Professional visual communication for campaigns, profiles, presentations, social media, and print.',
    features:['Social Media Design','Company Profiles','Campaign Creatives','Presentation & Print Design']
  },
  '/en/services/it-office-tech/': {
    heroTitle:'IT & Office Technology for Reliable Daily Operations',
    heroLead:'Practical infrastructure, setup, support, and maintenance for modern offices and growing teams.',
    features:['Network & Infrastructure','Office Technology Setup','Technical Support','Security & Maintenance']
  },
  '/en/services/nfc-digital-cards/': {
    heroTitle:'NFC Digital Cards for Smarter Professional Networking',
    heroLead:'Share your contact details, profile, services, and links instantly through one updateable digital card.',
    features:['Smart Digital Profile','Contactless Sharing','Central Management','Analytics & Updates']
  },
  '/en/services/printing/': {
    heroTitle:'Printing & Production with Consistent Brand Quality',
    heroLead:'From production-ready artwork to material selection and final delivery, every detail stays aligned with your identity.',
    features:['Production-Ready Artwork','Premium Materials','Quality Control','Delivery Coordination']
  },
  '/en/services/seo/': {
    heroTitle:'SEO as a Sustainable Growth Channel',
    heroLead:'Improve visibility, attract qualified demand, and build long-term organic growth through technical, content, and authority work.',
    features:['Technical SEO','Keyword Strategy','Content Architecture','Reporting & Growth']
  },
  '/en/services/web-development/': {
    heroTitle:'Web Development Designed for Performance and Conversion',
    heroLead:'Fast, responsive, and scalable websites built around the customer journey and your business goals.',
    features:['UX & Conversion Strategy','Responsive Development','Performance & SEO','Content Management & Support']
  }
};

const ARTICLE_CONFIG = {
  '/en/blog/brand-identity-vs-logo/': ['Brand Identity vs. Logo: What’s the Difference?','A logo is one visual asset. A brand identity is the complete system that makes your business recognizable and consistent.'],
  '/en/blog/content-system-that-lasts/': ['How to Build a Content System That Lasts','Move beyond isolated posts by building a repeatable content structure connected to audience needs and business goals.'],
  '/en/blog/how-to-choose-marketing-agency-qatar/': ['How to Choose a Marketing Agency in Qatar','A practical framework for evaluating strategy, capabilities, transparency, local understanding, and measurable value.'],
  '/en/blog/landing-page-or-full-site/': ['Landing Page or Full Website: Which Do You Need?','Choose the right format based on your objective, traffic source, customer journey, and the amount of trust your offer requires.'],
  '/en/blog/seo-as-growth-channel/': ['SEO as a Long-Term Growth Channel','Understand how technical quality, useful content, and authority work together to create sustainable organic demand.']
};

const BASIC_PAGES = {
  '/en/about/': {
    heroTitle:'A Virtual Company Built Around Senior Specialists',
    heroLead:'Wisal Tech brings strategy, creativity, technology, and delivery together through a flexible specialist team focused on business results.',
    sections:['What Makes Wisal Tech Different','One Connected Team, Not Separate Vendors','Principles That Guide Every Project','Ready to Build Something That Grows?']
  },
  '/en/services/': {
    heroTitle:'Integrated Digital Services Built Around Business Growth',
    heroLead:'Choose one focused capability or combine several services into a connected system designed around your priorities.',
    sections:['Choose the Capability You Need — or Build a Complete System','Clear Deliverables. Flexible Engagement.','Frequently Asked Questions.'],
    serviceTitles:['Brand Strategy & Identity','Graphic Design','Web Development','SEO & Organic Growth','Digital Marketing','ERP & Business Systems','Printing & Production','NFC Digital Cards','IT & Office Technology']
  },
  '/en/contact/': {
    heroTitle:'Let’s Build the Right Growth System for Your Business',
    heroLead:'Tell us what you are trying to achieve, what is currently blocking progress, and the outcome you want to create.',
    sections:['Tell Us What You Need','What Happens Next','Frequently Asked Questions.']
  },
  '/en/blog/': {
    heroTitle:'Insights for Building Stronger Brands and Digital Growth',
    heroLead:'Practical guidance on branding, content, websites, SEO, marketing, and the decisions that help businesses grow with clarity.',
    sections:['Latest Insights','Practical Guides for Better Decisions','Start with a Clear Strategy.'],
    articleTitles:['Brand Identity vs. Logo: What’s the Difference?','How to Build a Content System That Lasts','How to Choose a Marketing Agency in Qatar','Landing Page or Full Website: Which Do You Need?','SEO as a Long-Term Growth Channel']
  },
  '/en/privacy-policy/': {
    heroTitle:'Privacy Policy',
    heroLead:'This policy explains how Wisal Tech collects, uses, protects, and manages information when you contact us or use our website.',
    sections:['Information We Collect','How We Use Information','Data Protection','Your Rights','Contact Us']
  },
  '/en/terms-of-use/': {
    heroTitle:'Terms of Use',
    heroLead:'These terms explain the conditions for using the Wisal Tech website and the general responsibilities of visitors and users.',
    sections:['Website Use','Intellectual Property','Accuracy of Information','External Links','Limitation of Liability','Contact Us']
  }
};

function normalizePath(pathname){
  if(pathname === '/en') return '/en/';
  return pathname.endsWith('/') ? pathname : pathname + '/';
}

function buildConfig(path){
  if(path === '/en/') return {...HOME, type:'home'};
  if(path === '/en/work/') return {...WORK, type:'work'};
  if(SERVICE_DETAILS[path]) return {
    ...SERVICE_DETAILS[path],
    type:'service',
    sections:['What We Deliver','How This Service Supports Growth','Our Delivery Process','Frequently Asked Questions.']
  };
  if(ARTICLE_CONFIG[path]) return {
    type:'article',
    heroTitle:ARTICLE_CONFIG[path][0],
    heroLead:ARTICLE_CONFIG[path][1],
    sections:['The Core Idea','What Businesses Often Get Wrong','A Practical Approach','How Wisal Tech Can Help']
  };
  if(BASIC_PAGES[path]) return {...BASIC_PAGES[path], type:'basic'};
  return null;
}

class FirstReplacement {
  constructor(value, html=false){this.value=value;this.html=html;this.done=false}
  element(element){
    if(this.done || !this.value) return;
    element.setInnerContent(this.value,{html:this.html});
    element.setAttribute('data-en-fixed','true');
    this.done=true;
  }
}

class ListReplacement {
  constructor(values, html=false){this.values=values||[];this.html=html;this.index=0}
  element(element){
    if(this.index>=this.values.length) return;
    element.setInnerContent(this.values[this.index++],{html:this.html});
    element.setAttribute('data-en-fixed','true');
  }
}

class HeadInjector {
  element(element){element.append(`<style id="wisal-en-layout-fix">${ENGLISH_CSS}</style>`,{html:true})}
}

class BodyInjector {
  constructor(config){this.config=config}
  element(element){
    const serialized=JSON.stringify(this.config).replace(/</g,'\\u003c');
    element.append(`<script id="wisal-en-content-fix">(${clientFix.toString()})(${serialized});</script>`,{html:true});
  }
}

function clientFix(config){
  const q=(selector)=>Array.from(document.querySelectorAll(selector));
  const setList=(selector,values)=>q(selector).forEach((el,i)=>{if(values&&values[i]){el.textContent=values[i];el.dataset.enFixed='true'}});
  const setFirst=(selector,value)=>{const el=document.querySelector(selector);if(el&&value){el.textContent=value;el.dataset.enFixed='true'}};
  const garbage=/Language Options|Transform your business with cutting-edge digital products|Innovative Digital Solutions Tailored for Qatar(?:'|’)?s Market|Explore Our Portfolio(?: Concept)?/i;
  const genericParagraph='A clear, connected digital solution designed around the business objective, the customer journey, and measurable results.';
  const genericHeading='Integrated Digital Solution';

  if(config.type==='home'){
    setList('.stat-card span',config.stats);
    setList('.problem-card h3',config.problemTitles);
    setList('.problem-card p',config.problemDescriptions);
    setList('.bento-card h3',config.bentoTitles);
    setList('.bento-card p',config.bentoDescriptions);
    setList('.process-row-copy h3,.process-step h3',config.processTitles);
    setList('.process-row-copy p,.process-step p',config.processDescriptions);
    setFirst('.cta-panel h2',config.ctaTitle);
    setFirst('.cta-panel p',config.ctaText);
  }
  if(config.type==='work'){
    setFirst('.case-content h2',config.caseTitle);
    setFirst('.case-content>p',config.caseText);
    setList('[data-work-filter],.gallery-toolbar .filter-btn',config.filters);
    setList('.portfolio-item .caption b',config.portfolioTitles);
    setList('.portfolio-item .caption span',config.portfolioLabels);
    setList('.portfolio-item .caption p',config.portfolioDescriptions);
    setList('.timeline-step h3',config.processTitles);
    setList('.timeline-step p',config.processDescriptions);
    setList('.faq-q span',config.faqQuestions);
    setList('.faq-a p',config.faqAnswers);
    q('.concept-badge').forEach((el,i)=>{el.textContent=config.portfolioLabels[i%config.portfolioLabels.length]||'Wisal Tech Project'});
    setList('.case-narrative-item h4',['Challenge','Strategy','Design System','Business Application']);
    setList('.case-narrative-item p',[
      'Create one recognizable identity that works across different formats and customer touchpoints.',
      'Define a clear hierarchy, visual language, and practical set of rules before producing assets.',
      'Build flexible components that remain consistent across digital and printed applications.',
      'Prepare the final system for real day-to-day use by the business and its teams.'
    ]);
  }
  if(config.type==='service'){
    setList('.service-card h3,.feature-card h3,.deliverable-box h3',config.features);
    setList('.service-card p,.feature-card p',config.features.map((title)=>`${title} delivered as part of a clear, practical system aligned with your business goals.`));
  }
  if(config.type==='basic' && config.serviceTitles) setList('.service-card h3',config.serviceTitles);
  if(config.type==='basic' && config.articleTitles) setList('.insight-card h3,.article-card h3',config.articleTitles);

  q('main h1,main h2,main h3,main h4,main p,main button,main .caption span,main .caption b').forEach((el)=>{
    if(el.dataset.enFixed==='true') return;
    const text=(el.textContent||'').replace(/\s+/g,' ').trim();
    if(!garbage.test(text)) return;
    const tag=el.tagName.toLowerCase();
    if(tag==='p') el.textContent=genericParagraph;
    else if(tag==='button') el.textContent='View Details';
    else if(tag==='span'||tag==='b') el.textContent='Wisal Tech';
    else el.textContent=genericHeading;
    el.dataset.enFixed='true';
  });

  q('main p').forEach((el)=>{
    const text=(el.textContent||'').replace(/\s+/g,' ').trim();
    if(text.length>520 && garbage.test(text)) el.textContent=genericParagraph;
  });
}

export default {
  async fetch(request, env){
    const url=new URL(request.url);
    const path=normalizePath(url.pathname);
    const assetResponse=await env.ASSETS.fetch(request);
    const type=assetResponse.headers.get('content-type')||'';
    const config=buildConfig(path);
    if(!config || !type.includes('text/html')) return assetResponse;

    const rewriter=new HTMLRewriter()
      .on('head',new HeadInjector())
      .on('body',new BodyInjector(config))
      .on('main h1',new FirstReplacement(config.heroTitle))
      .on('main p',new FirstReplacement(config.heroLead))
      .on('.section-head h2',new ListReplacement(config.sections));

    return rewriter.transform(assetResponse);
  }
};
