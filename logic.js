    let userEmail = '';

    function getMaturityForm() {
      return document.querySelector('form[maturity-form]')
        || document.querySelector('[maturity-form] form')
        || document.getElementById('wf-form-MaturityAssessment');
    }

    function setInitialAssessmentState() {
      const maturitySection = document.getElementById('maturity');
      const assessmentSection = document.getElementById('assessment-section');
      const maturityForm = getMaturityForm();
      const formWrapper = maturityForm ? maturityForm.closest('.w-form') : null;
      const successState = formWrapper ? formWrapper.querySelector('.w-form-done') : null;
      const errorState = formWrapper ? formWrapper.querySelector('.w-form-fail') : null;
      const hasSavedResult = new URLSearchParams(window.location.search).has('result');

      if (hasSavedResult) {
        if (maturitySection) maturitySection.style.display = 'none';
        if (assessmentSection) assessmentSection.style.display = 'block';
        return;
      }

      if (maturitySection) maturitySection.style.display = 'block';
      if (assessmentSection) assessmentSection.style.display = 'none';
      if (maturityForm) maturityForm.style.display = 'block';
      if (successState) successState.style.display = 'none';
      if (errorState) errorState.style.display = 'none';
    }

    function loadDPMAPDFLib(url) {
      return new Promise(function(resolve, reject) {
        const existing = document.querySelector('script[data-dpma-lib="' + url + '"]');
        if (existing && existing.getAttribute('data-loaded') === 'true') {
          resolve();
          return;
        }
        const script = existing || document.createElement('script');
        if (!existing) {
          script.src = url;
          script.async = true;
          script.setAttribute('data-dpma-lib', url);
          document.head.appendChild(script);
        }
        script.addEventListener('load', function() {
          script.setAttribute('data-loaded', 'true');
          resolve();
        }, { once: true });
        script.addEventListener('error', function() {
          reject(new Error('Failed to load ' + url));
        }, { once: true });
      });
    }

    const dpmaPdfLibsPromise = Promise.all([
      loadDPMAPDFLib('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
      loadDPMAPDFLib('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
    ]);

    document.addEventListener('DOMContentLoaded', function() {
      const maturityForm = getMaturityForm();
      const maturitySection = document.getElementById('maturity');
      const assessmentSection = document.getElementById('assessment-section');

      setInitialAssessmentState();
      dpmaPdfLibsPromise.catch(function() {});

      if (maturityForm) {
        maturityForm.addEventListener('submit', function(e) {
          e.preventDefault();

          const emailInput = this.querySelector('input[type="email"], input[name="email"], input[name="Email"], input[name="email_id"]');
          if (emailInput) {
            userEmail = emailInput.value.trim();
          }

          if (maturitySection) maturitySection.style.display = 'none';
          if (assessmentSection) {
            assessmentSection.style.display = 'block';
            setTimeout(function() {
              assessmentSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            }, 50);
          }
        });
      }
    });

    function submitAssessmentData() {
      if (!userEmail) {
        return;
      }

      try {
        const assessmentUrl = window.location.href;
        const scores = Array.isArray(window.DPMA_answers) ? window.DPMA_answers : [];

        if (!scores || scores.length === 0) {
          return;
        }

        const validScores = scores.filter(s => s !== null && s !== undefined);
        const minScore = Math.min(...validScores.map(s => s || 1));
        const maturityLevel = `Level ${minScore}`;

        const maturityData = {
          1: { name: "Ad Hoc", pct: 10 },
          2: { name: "Emerging", pct: 20 },
          3: { name: "Defined", pct: 40 },
          4: { name: "Managed", pct: 60 },
          5: { name: "Optimised", pct: 80 }
        };
        const maturityPct = maturityData[minScore]?.pct || 0;

        const dimensions = [
          "Definition & Scope", "Ownership & Accountability", "Discoverability & Access",
          "Documentation & Semantics", "Data Quality & Trust", "SLAs, Reliability & Freshness",
          "Governance & Security", "Reusability & Interoperability", "Consumption, Adoption & Value"
        ];

        const dimensionScores = dimensions.map((dim, idx) => {
          const score = scores[idx] || 1;
          return `${dim}: L${score}`;
        }).join(' | ');

        const weakest = dimensions
          .map((dim, idx) => ({ dim, score: scores[idx] || 1 }))
          .filter(d => d.score <= 3)
          .map(d => `${d.dim} (L${d.score})`)
          .join(' | ');

        const strongest = dimensions
          .map((dim, idx) => ({ dim, score: scores[idx] || 1 }))
          .filter(d => d.score >= 4)
          .map(d => `${d.dim} (L${d.score})`)
          .join(' | ');

        const answersString = scores.join(',');

        const setFieldValue = function(selectors, value) {
          const field = document.querySelector(selectors);
          if (!field) {
            return;
          }
          field.value = value;
        };
        setFieldValue('#hidden-email, input[name="email"]', userEmail);
        setFieldValue('#hidden-assessment-url, input[name="assessment-url"]', assessmentUrl);
        setFieldValue('#hidden-maturity-level, input[name="maturity-level"]', maturityLevel);
        setFieldValue('#hidden-maturity-percentage, input[name="maturity-percentage"]', maturityPct + '%');
        setFieldValue('#hidden-dimension-scores, input[name="dimension-scores"]', dimensionScores);
        setFieldValue('#hidden-weakest-dimensions, input[name="weakest-dimensions"]', weakest || 'None - all dimensions are strong');
        setFieldValue('#hidden-strongest-dimensions, input[name="strongest-dimensions"]', strongest || 'No strengths yet - keep building');
        setFieldValue('#hidden-assessment-answers, #assessment-answers, input[name="assessment-answers"]', answersString);

        const hiddenForm = document.getElementById('assessment-data-form')
          || document.getElementById('wf-form-Assessment-Data')
          || document.querySelector('form[data-name="Assessment Data"]');
        if (hiddenForm) {
          hiddenForm.method = 'post';
          const submitButton = hiddenForm.querySelector('input[type="submit"], button[type="submit"]');
          if (typeof hiddenForm.requestSubmit === 'function') {
            hiddenForm.requestSubmit(submitButton || undefined);
          } else if (submitButton) {
            submitButton.click();
          } else {
            hiddenForm.submit();
          }
        }
      } catch (error) {
      }
    }

    
  var DPMA = function() {
  "use strict";
  var e = [ "Definition & Scope", "Ownership & Accountability", "Discoverability & Access", "Documentation & Semantics", "Data Quality & Trust", "SLAs, Reliability & Freshness", "Governance & Security", "Reusability & Interoperability", "Consumption, Adoption & Value" ], t = [ "Definition", "Ownership", "Discovery", "Docs", "Quality", "SLAs", "Governance", "Reuse", "Consumption" ], a = {
    "Definition & Scope": [ "Table / View", "Curated Dataset", "Defined Data Product", "Productized Asset", "Composable Product" ],
    "Ownership & Accountability": [ "Unowned", "Technical Owner", "Data Product Owner", "Product Team", "Product Operating Model" ],
    "Discoverability & Access": [ "Tribal Knowledge", "Documented Lists", "Cataloged", "Self-Service Access", "Data Marketplace" ],
    "Documentation & Semantics": [ "None", "Partial", "Business-Ready", "Standardised", "Machine-Readable" ],
    "Data Quality & Trust": [ "Assumed Correct", "Manual Checks", "Defined Quality Rules", "Monitored & Enforced", "Self-Healing" ],
    "SLAs, Reliability & Freshness": [ "Unknown", "Best Effort", "Defined SLAs", "Enforced SLOs", "Predictive Reliability" ],
    "Governance & Security": [ "Manual Access", "Tool-Based Access", "Centralised Governance", "Embedded Governance", "Continuous Compliance" ],
    "Reusability & Interoperability": [ "One-Off", "Limited Reuse", "Designed for Reuse", "Interoperable", "Composable Product" ],
    "Consumption, Adoption & Value": [ "Unknown Usage", "Anecdotal", "Measured Adoption", "Outcome-Driven", "Strategic Asset" ]
  }, i = [ {
    cat: "Dimension 1: Definition & Scope",
    text: "How clearly is your data product defined: its purpose, boundaries, and the business problem it solves?",
    opts: [ "Data product = a table or view in warehouse. No clear boundary, no versioning, no lineage, no defined consumers, no business context or glossary information. No unique identifier or standard addressing scheme.", "Some transformation logic applied but is not auditable or reusable. Tightly coupled to a project or team. Informal naming conventions exist.", "Clear definition of inputs, outputs, semantics, lineage, and purpose. Product boundary documented. Multiple consumers are expected. Tightly coupled to a use case. Unique URN/URI assigned following organizational standards. Schema versioning with documented change logs.", "Includes data, metadata, contracts, access interfaces, and lifecycle management. Treated as a reusable asset. Semantic versioning with backward compatibility guarantees. Stable, versioned APIs.", "Modular, composable, and designed to plug into other products, analytics, and AI use cases seamlessly (i.e., within a few hours). Fully addressable via standard protocols (APIs, SQL endpoints, data catalogs) with stable versioned URIs. Full version management with deprecation policies, migration paths, and consumer notification." ]
  }, {
    cat: "Dimension 2: Ownership & Accountability",
    text: "How clearly are data product owners and their accountability defined within your organisation?",
    opts: [ 'No named owner. Not clear who built it. "Whoever built it" maintains it when issues arise.', "Owned by an engineer or analyst informally. Responsibility is reactive.", "Named owner accountable for business relevance, quality, availability, and roadmap.", "Dedicated cross-functional team (engineering, analytics, governance). Clear prioritization, escalation, and support model.", "Ownership embedded into org design, incentives, OKRs, and funding models." ]
  }, {
    cat: "Dimension 3: Discoverability & Access",
    text: "How easily can data consumers find and access your data product through catalogs or marketplaces?",
    opts: [ "Users find data via Slack/Teams, email, or personal connections.", "Some documentation exists (wiki, spreadsheet) but is incomplete, manual, and/or outdated.", "Data products are registered in a catalog with searchable metadata. Basic access request workflows exist.", "Users can discover, evaluate fitness for purpose, and access data products without manual intervention. Clear SLAs for access provisioning.", "Products are browsable, versioned, and consumable like a storefront (APIs, SQL, BI, AI). Rich discovery with usage analytics, ratings, and recommendations." ]
  }, {
    cat: "Dimension 4: Documentation & Semantics",
    text: "How complete and self-service is the documentation accompanying your data product?",
    opts: [ "Column names are the only documentation. No lineage information.", "Some descriptions exist but lack business meaning or examples. Partial lineage, some upstream/downstream dependencies documented informally.", "Clear definitions, metric logic, grain, and usage guidance included. Lineage documented at data product level showing input/output relationships.", "Documentation follows consistent templates and semantic models. Minimal or zero documentation drift. Automated lineage tracking with impact analysis capabilities.", "Semantics usable by BI tools, AI agents, and automated reasoning systems. Full end-to-end lineage supporting AI/ML provenance requirements, integrated into discovery and impact analysis." ]
  }, {
    cat: "Dimension 5: Data Quality & Trust",
    text: "To what extent does your organisation monitor and enforce data quality standards for this product?",
    opts: [ "No checks. Errors discovered by users.", "Ad-hoc validation queries run occasionally.", "Explicit checks for freshness, completeness, accuracy, validity.", "Automated checks with alerts and dashboards with clear actions and actors to remediate.", "Quality issues trigger automated remediation or fallback behavior. Data integrity verification and provenance attestation." ]
  }, {
    cat: "Dimension 6: SLAs, Reliability & Freshness",
    text: "How well are service level agreements (SLAs) defined and enforced for your data product?",
    opts: [ "No idea when data updates or if it is late.", "Informal or on-demand refresh expectations.", "Update frequency, availability windows, and latency SLAs documented and aligned with consumer use case requirements.", "SLAs actively monitored with incident response. Clear escalation paths and remediation procedures.", "System anticipates failures and adjusts proactively. Self-healing infrastructure with automatic failover." ]
  }, {
    cat: "Dimension 7: Governance & Security",
    text: "How mature is the governance framework: access controls, lineage, and compliance for your data product?",
    opts: [ "Broad or minimal access with limited controls, assigned manually. Policy is driven through excel sheets.", "Basic role-based permissions applied manually. No central management of access control. No routine audits for inappropriate or outdated access.", "Governance rules applied consistently across products. Limited centralized governance with defined policies.", "Policies enforced automatically at product level with audit trails and tamper-evident logging.", "Governance adapts dynamically to usage, risk, and regulation. Data integrity verification and provenance attestation. Zero-trust security model." ]
  }, {
    cat: "Dimension 8: Reusability & Interoperability",
    text: "How reusable and interoperable is your data product across different teams, domains, and systems?",
    opts: [ "Built for a single report or team.", "Occasionally reused with rework (i.e., parts of the stack are still point-to-point).", "Stable schemas, contracts, and backward compatibility. Standard data formats and protocols.", "Integrates easily across tools, domains, and platforms. Standardized APIs and data exchange formats.", "Products are building blocks for other data and AI products. Supports federation and cross-domain composition." ]
  }, {
    cat: "Dimension 9: Consumption, Adoption & Value",
    text: "How effectively is your data product consumed and does it demonstrably deliver business value?",
    opts: [ "No visibility into who uses the data.", "Usage known informally.", "Usage metrics and feedback captured.", "Data products tied to FinOps and business KPIs. Proactive management of data product lifecycle to balance data ecosystem footprint with business value generation.", "Data products directly drive revenue, cost reduction, or competitive advantage. Clear ROI attribution and value measurement." ]
  } ], n = {
    1: {
    num: "LEVEL 1",
    name: "Ad Hoc",
    pct: 10,
    desc: "You have a reactive, unstructured approach to data management. Data is treated as a byproduct rather than as a product in its own right."
    },
    2: {
    num: "LEVEL 2",
    name: "Emerging",
    pct: 20,
    desc: "There is initial recognition of data as valuable at this stage. Basic data practices exist, but are very inconsistent across the organisation. Data delivery is often point-to-point and driven by specific use cases."
    },
    3: {
    num: "LEVEL 3",
    name: "Defined",
    pct: 40,
    desc: "This level is characterised by standardised processes and clear ownership structures. Data products are intentionally designed."
    },
    4: {
    num: "LEVEL 4",
    name: "Managed",
    pct: 60,
    desc: "Your organisation demonstrates proactive management with monitoring and automation capabilities. Data products are treated as strategic assets."
    },
    5: {
    num: "LEVEL 5",
    name: "Optimised",
    pct: 80,
    desc: "At this highest level, organisations embrace continuous improvement and innovation. Data products drive competitive advantage and enable faster time-to-market."
    }
  }, s = {
    "Definition & Scope": [ null, "Identify a small number of frequently used tables and apply lightweight transformations to make them usable for a specific team or use case. Introduce informal but consistent naming conventions and document which project or team the dataset supports. The goal is to move from raw storage to intentional, team-level curation.", "Explicitly define what the dataset represents, where it comes from, and who it is for. Document inputs, outputs, and intended usage, and assign a unique identifier. Introduce basic schema versioning and start tracking changes so consumers can rely on stability.", "Treat your data like a software product by creating formal data contracts that specify schema, SLAs, quality guarantees, and backward compatibility policies. Implement semantic versioning (v1.0, v1.1, v2.0) with clear deprecation timelines for breaking changes. Build stable access interfaces like REST APIs, GraphQL endpoints, or SQL views that abstract underlying complexity. Establish lifecycle management processes, including release notes, migration guides for version changes, and sunset policies. Use tools like dbt contracts or Great Expectations to enforce data contracts automatically.", null ],
    "Ownership & Accountability": [ null, "Create a simple ownership registry mapping each critical data asset to a technical contact person, typically the engineer or analyst who built it. Use a spreadsheet, or add ownership tags in your data catalog. Ensure this person is identified as the go-to for questions or issues, even if their responsibility is reactive. Communicate ownership assignments to stakeholders so they know who to contact when problems occur.", "Appoint formal Data Product Owners who are accountable not just for technical maintenance but for the business value and strategic direction of the data product. Define clear responsibilities, including maintaining quality, ensuring availability, gathering user feedback, prioritizing enhancements, and managing the product roadmap. Document these ownership assignments in your data catalog with contact information and escalation paths. Provide training on product management principles adapted for data, covering user research, prioritisation frameworks, and stakeholder management.", "Form cross-functional squads for your most critical data products, bringing together data engineers, analytics engineers, data analysts, and governance specialists. Establish clear team charters defining scope, success metrics, and operating principles. Implement structured prioritisation processes using frameworks like RICE (Reach, Impact, Confidence, Effort) or weighted scoring. Create formal escalation paths with defined SLAs for different issue severities. Set up support models, including on-call rotations, ticketing systems, and office hours for user support. Adopt agile ceremonies like sprint planning and retrospectives adapted for data work.", null ],
    "Discoverability & Access": [ null, "Create a simple inventory of your data assets; start with a shared spreadsheet or wiki page listing key datasets, their locations, brief descriptions, update frequency, and owner contact information. Encourage teams to contribute entries for datasets they create or maintain. Focus on your most-used or most-critical data assets first rather than attempting comprehensive coverage. Accept that this documentation will become outdated; the goal is to establish a culture of documentation and create a foundation for more sophisticated solutions later.", "Implement a data catalog tool (DataHub, Alation, Collibra, or cloud-native options like AWS Glue Catalog) and migrate your documented lists into it. Configure automated metadata harvesting to keep catalog entries up-to-date. Enrich catalog entries with business descriptions, tags, data classifications, lineage information, and sample queries. Establish basic access request workflows. This could be as simple as a form that creates tickets or as sophisticated as integrated IAM workflows. Train users on how to search the catalog and request access, and make catalog usage part of onboarding for new team members.", 'Automate access provisioning by integrating your catalog with identity management systems (Okta, Azure AD) and implementing role-based access control. Add fitness-for-purpose indicators in your catalog: data quality scores, freshness metrics, usage statistics, and user ratings that help users evaluate if data meets their needs. Implement self-service approval workflows with clear SLAs (e.g., "access granted within 2 hours for standard datasets"). Provide sandbox or sample environments where users can explore data before requesting production access. Create in-catalog documentation, tutorials, and sample queries that enable self-service onboarding.', null ],
    "Documentation & Semantics": [ null, 'Start adding basic descriptions to your most important datasets, even simple notes like "customer purchase transactions from e-commerce platform" are better than nothing. Document field-level descriptions explaining what each column represents in plain language. Create simple lineage diagrams showing where data originates and where it flows, even if just in PowerPoint or draw.io. Focus on the top 10–20 most-used datasets first to get quick wins. Store this documentation wherever your team naturally works, wiki pages, README files, or spreadsheets.', "Work with business stakeholders to create a business glossary defining terms in business language (e.g., \\\"What is an 'active customer'?\\\"). For every metric, document the calculation logic, grain (daily/monthly, customer/account level), business rules, and edge cases. Add usage guidance explaining appropriate use cases, known limitations, and common pitfalls. Implement automated lineage tracking using tools like dbt, Monte Carlo, or Collibra that capture data flows at the table and column level. Create standardised documentation templates to ensure consistency across all data products.", "Establish organisation-wide documentation standards and semantic data models that ensure consistency across all teams. Implement documentation-as-code where metadata, business definitions, and lineage are versioned alongside transformation code in Git. Deploy end-to-end lineage tracking tools that automatically capture dependencies and enable impact analysis showing downstream effects of proposed changes. Create documentation quality gates in CI/CD pipelines; pull requests can't be merged without proper documentation. Schedule regular documentation audits to catch and fix drift, or better yet, automate drift detection that alerts owners when documentation becomes stale.", null ],
    "Data Quality & Trust": [ null, "Build a library of validation SQL queries for your critical datasets, simple checks like row count validations, null checks on key columns, range checks on numeric fields, and referential integrity checks. Run these queries manually on a regular schedule (weekly or after major data loads). Document the queries in a shared location with explanations of what each checks for. Create a shared log or spreadsheet recording when checks were run and what issues were found. This manual process builds quality awareness and creates the foundation for automation.", "Define explicit data quality rules for each data product covering: freshness (data updated within expected timeframe), completeness (no unexpected nulls or missing records), accuracy (values within reasonable ranges), and validity (values conform to business rules). Document these rules as part of your data product specifications or data contracts. Implement data quality testing frameworks like Great Expectations, dbt tests, or Soda to codify and execute these rules systematically. Make passing quality tests a prerequisite for data to be promoted to production. Create quality scorecards showing compliance over time.", "Automate all quality checks to run on every data refresh or as part of your orchestration workflows (Airflow, Dagster, Prefect). Build real-time monitoring dashboards showing quality status across your data ecosystem with clear red/yellow/green indicators for each metric. Implement automated alerting (PagerDuty, Slack, email) that notifies data product owners when quality thresholds are breached, with severity levels and clear escalation paths. Define incident response procedures specifying actions for different failure types (e.g., block downstream processing if completeness fails). Establish quality SLAs and track them publicly to create accountability.", null ],
    "SLAs, Reliability & Freshness": [ null, "Document current refresh patterns for your key datasets, when do pipelines typically run, and how long do they take? Create a simple status page (even a spreadsheet or wiki) showing the last successful refresh time for critical datasets. Set up basic monitoring in your orchestration tool to track pipeline completion times. Send manual notifications to stakeholders when delays occur. While you're not making formal commitments, you're building awareness of data freshness patterns and establishing the foundation for SLAs.", "Work directly with data consumers to understand their actual freshness requirements. Don't assume, rather ask questions like \"How old can this data be before it impacts your decisions?\" Document formal SLAs for each data product specifying: update frequency (hourly, daily, weekly), expected latency (data available within X hours of source update), availability windows, and acceptable downtime. Publish these SLAs in your data catalog and include them in data contracts. Right-size your SLAs to match true business needs rather than over-engineering; this makes commitments achievable and sustainable.", "Implement comprehensive monitoring that tracks SLA compliance in real-time and automatically raises incidents when SLAs are breached. Define Service Level Objectives (SLOs) with error budgets that balance reliability with development velocity. Create incident response playbooks documenting step-by-step remediation procedures for different types of SLA violations. Establish clear escalation paths from on-call data engineers through to leadership with defined timeframes. Build post-mortem processes that analyse SLA breaches to identify root causes and prevent recurrence. Measure and publicly report SLA compliance rates to create transparency and accountability.", null ],
    "Governance & Security": [ null, "Implement the identity and access management (IAM) capabilities of your data platform (Snowflake RBAC, Databricks Unity Catalog, BigQuery IAM). Define basic roles aligned with job functions (analyst, engineer, data scientist, admin) and begin manually assigning users to these roles. Start with coarse-grained controls at the database or schema level before tackling table or column-level permissions. Move your access tracking from spreadsheets into your IAM tool, where grants can be audited. While still manually managed, this provides better visibility and a foundation for more sophisticated governance.", "Establish a centralised data governance function or committee responsible for defining and enforcing policies. Create a data classification scheme (public, internal, confidential, restricted) with associated access policies for each classification level. Implement a governance platform that provides centralised policy definition and enforcement across your data ecosystem. Standardise governance processes across teams so everyone follows the same procedures for data access, sharing, and retention. Implement quarterly access reviews where managers certify their team's access is still appropriate. Document all governance policies in a central location accessible to all data users.", "Embed governance policies directly into data products through policy-as-code where access controls, masking rules, and quality requirements are defined alongside data transformations (e.g., dbt models with policy tags). Implement automated policy enforcement using tools like Immuta, Privacera, or native platform features that dynamically apply access controls and masking without manual intervention. Deploy comprehensive audit logging that captures all data access, modifications, and sharing activities with tamper-evident storage (append-only logs). Use attribute-based access control (ABAC) that applies policies based on user attributes, data sensitivity tags, and request context. Set up continuous compliance monitoring dashboards showing adherence to regulations like GDPR, HIPAA, or SOC 2.", null ],
    "Reusability & Interoperability": [ null, 'When building new data assets, ask yourself: "Could another team use this?" Design datasets to be slightly more generic than your immediate use case requires, and avoid hardcoding assumptions specific to one report or dashboard. Document your datasets sufficiently that others can discover and understand them. Create simple interfaces like views that make your data easier for others to consume without deep knowledge of underlying structures. Share information about available datasets through team channels or documentation. Accept that reuse will require some adaptation work initially; this learning informs better design patterns.', "Design data products explicitly for multiple consumers from day one. Establish stable schemas with versioning that maintains backward compatibility when changes are necessary (e.g., additive changes only, or provide both v1 and v2 simultaneously during migration periods). Create formal data contracts specifying the interface, SLAs, and quality guarantees consumers can depend on. Adopt industry-standard data formats (Parquet, Avro, JSON) and protocols (REST APIs, JDBC/ODBC, SQL) rather than proprietary formats. Implement comprehensive integration testing that validates your data products work correctly for all known consumers before releasing changes. Document breaking changes with migration guides and provide advanced notice.", "Adopt industry-standard APIs and protocols that work across different tools and platforms, like REST APIs, GraphQL for flexible queries, gRPC for high-performance, and JDBC/ODBC for SQL access. Implement standard metadata schemas (Apache Atlas, DCAT) that enable seamless integration with various tools. Build pre-built connectors or adapters for popular tools in your ecosystem (Tableau, Power BI, Databricks notebooks, Python/R clients). Design data products to be platform-agnostic where possible, avoid tight coupling to specific vendors. Create comprehensive integration guides with code samples showing how to consume your data products from various platforms and languages. Regularly test interoperability by validating your data works correctly with a diverse set of downstream tools.", null ],
    "Consumption, Adoption & Value": [ null, "Start gathering anecdotal evidence of data usage through informal channels. When teams mention using your data assets in meetings or conversations, document these use cases in a spreadsheet or wiki. Create feedback channels like Slack channels, email lists, or Teams where data consumers can ask questions and share experiences. These discussions reveal usage patterns. Periodically check in with known users to understand how they're using the data and what challenges they face. Maintain a simple registry of known consumers and their use cases. This informal knowledge provides valuable insights even without sophisticated tracking.", "Implement usage tracking using your data platform's built-in capabilities, most platforms provide query logs, access logs, and usage analytics. Build dashboards showing key adoption metrics: number of active users (daily/weekly/monthly), query frequency, data volume consumed, most popular datasets, and usage trends over time. Implement systematic feedback collection through surveys (quarterly user satisfaction surveys), feedback forms embedded in your data catalog, or regular user interviews. Track support requests and data quality incidents to identify pain points. Create monthly or quarterly adoption reports shared with data product teams and leadership to inform data-informed investment decisions.", "Connect data product metrics to tangible business outcomes, work with business leaders to understand how each data product contributes to revenue, cost reduction, customer satisfaction, or operational efficiency. Implement FinOps practices that measure the cost to produce, store, and maintain each data product (compute, storage, engineering time) and compare against the business value delivered. Create value dashboards showing ROI for each data product and use them to inform investment decisions. Establish lifecycle management processes that regularly review data products for potential retirement when the value no longer justifies the costs. Implement portfolio management where data products are prioritised, invested in, or sunset based on their business impact and cost. Require business cases for new data products that clearly articulate expected value, target users, and success metrics.", null ]
  }, o = new Array(9).fill(null), r = 0, c = new Set(e), l = "#assessment";
  
  window.DPMA_answers = o;
  
  function d(e, t, a) {
    var i = window.devicePixelRatio || 1;
    e.width = t * i, e.height = a * i, e.style.width = t + "px", e.style.height = a + "px";
    var n = e.getContext("2d");
    return n.scale(i, i), n;
  }
  function u(e) {
    for (var t = 0, a = 0; a < 9; a++) t = 5 * t + ((e[a] || 1) - 1);
    return "v1-" + t.toString(36);
  }
  function m(e) {
    if (!e) return null;
    var t = e.split("-");
    if ("v1" !== t[0] || !t[1]) return null;
    var a = parseInt(t[1], 36);
    if (isNaN(a)) return null;
    for (var i = [], n = 8; n >= 0; n--) i[n] = a % 5 + 1, a = Math.floor(a / 5);
    for (var s = 0; s < 9; s++) if (i[s] < 1 || i[s] > 5) return null;
    return i;
  }
  function p(e) {
    var t = document.querySelectorAll(".dpma-qcard");
    t.forEach(function(e) {
    e.classList.remove("active");
    }), t[e].classList.add("active");
    var a = t[e];
    if (a.querySelector(".dpma-btn-prev").disabled = 0 === e, a.querySelector(".dpma-btn-next").disabled = null === o[e], 
    a.querySelectorAll(".dpma-opt").forEach(function(t) {
    var a = parseInt(t.getAttribute("data-val"));
    t.classList.toggle("selected", a === o[e]);
    }), y(), e > 0) {
    var i = document.querySelector(l);
    i && i.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
    }
  }
  function h() {
    var e = o.filter(function(e) {
    return null !== e;
    }).length, t = Math.round(e / 9 * 100), a = document.getElementById("dpmaFill"), i = document.getElementById("dpmaPct");
    a && (a.style.width = t + "%"), i && (i.textContent = t + "%");
  }
  function g() {
    return getComputedStyle(document.documentElement).getPropertyValue("--md-primary").trim() || "#E8884A";
  }
  function f(e, a, i, n, s) {
    var r = a / 2, c = i / 2 + s.cyOffset, l = g(), d = getComputedStyle(document.documentElement).getPropertyValue("--md-font-body").trim() || "Century Gothic, Verdana, sans-serif", u = s.labelSize || 12, m = s.dotSize || 4, p = s.lineW || 2, h = s.showLevelLabels || !1;
    e.clearRect(0, 0, 2 * a, 2 * i);
    for (var f = 1; f <= 5; f++) {
    var y = n * f / 5;
    e.beginPath();
    for (var v = 0; v < 9; v++) {
      var b = 2 * Math.PI * v / 9 - Math.PI / 2, w = r + y * Math.cos(b), x = c + y * Math.sin(b);
      0 === v ? e.moveTo(w, x) : e.lineTo(w, x);
    }
    e.closePath(), e.strokeStyle = "rgba(255,255,255,.1)", e.lineWidth = 1, e.stroke(), 
    h && (e.fillStyle = "rgba(255,255,255,.25)", e.font = "600 10px " + d, e.textAlign = "center", 
    e.fillText("L" + f, r, c - y + 13));
    }
    for (v = 0; v < 9; v++) b = 2 * Math.PI * v / 9 - Math.PI / 2, e.beginPath(), e.moveTo(r, c), 
    e.lineTo(r + n * Math.cos(b), c + n * Math.sin(b)), e.strokeStyle = "rgba(255,255,255,.07)", 
    e.lineWidth = 1, e.setLineDash([ 4, 4 ]), e.stroke(), e.setLineDash([]);
    var k = n + s.labelPad;
    for (v = 0; v < 9; v++) {
    b = 2 * Math.PI * v / 9 - Math.PI / 2;
    var A = r + k * Math.cos(b), S = c + k * Math.sin(b), D = !s.activeCheck || s.activeCheck(v), E = null !== o[v];
    e.fillStyle = D ? E || s.forceActiveLabels ? "rgba(245,240,235,.85)" : "rgba(255,255,255,.25)" : "rgba(255,255,255,.2)", 
    e.font = "600 " + u + "px " + d, e.textAlign = "center", e.textBaseline = "middle", 
    e.fillText(t[v], A, S);
    }
    var L = [];
    for (v = 0; v < 9; v++) {
    var I = (s.valFn ? s.valFn(v) : o[v] || 0) / 5 * n;
    b = 2 * Math.PI * v / 9 - Math.PI / 2, L.push({
      x: r + I * Math.cos(b),
      y: c + I * Math.sin(b)
    });
    }
    e.beginPath(), L.forEach(function(t, a) {
    0 === a ? e.moveTo(t.x, t.y) : e.lineTo(t.x, t.y);
    }), e.closePath(), e.fillStyle = "rgba(200,90,25,.32)", e.fill(), e.strokeStyle = l, 
    e.lineWidth = p, e.stroke(), L.forEach(function(t, a) {
    (s.valFn ? s.valFn(a) : o[a] || 0) > 0 && (e.beginPath(), e.arc(t.x, t.y, m, 0, 2 * Math.PI), 
    e.fillStyle = l, e.fill());
    });
  }
  function y() {
    document.querySelectorAll(".dpma-mini-radar").forEach(function(e) {
    f(d(e, 260, 240), 260, 240, .32 * Math.min(260, 240), {
      cyOffset: 6,
      labelPad: 22,
      labelSize: 9,
      dotSize: 3.5,
      lineW: 1.5,
      forceActiveLabels: !1
    });
    });
  }
  function v() {
    var t = document.getElementById("dpmaRadar");
    t && f(d(t, 460, 420), 460, 420, .36 * Math.min(460, 420), {
    cyOffset: 10,
    labelPad: 32,
    labelSize: 13,
    dotSize: 5,
    lineW: 2.5,
    showLevelLabels: !0,
    forceActiveLabels: !0,
    activeCheck: function(t) {
      return c.has(e[t]);
    },
    valFn: function(t) {
      return c.has(e[t]) && o[t] || 0;
    }
    });
  }
  function b() {
    var i = Math.min.apply(null, o.map(function(e) {
    return e || 1;
    })), r = n[i];
    document.getElementById("dpmaLvlNum").textContent = r.num, document.getElementById("dpmaLvlBadge").textContent = r.name, 
    document.getElementById("dpmaMeans").textContent = r.desc, document.getElementById("dpmaDonutPct").textContent = r.pct + "%";
    var l = e.map(function(e, t) {
    return {
      ax: e,
      score: o[t] || 1
    };
    }).sort(function(e, t) {
    return e.score - t.score;
    }), m = l.filter(function(e) {
    return e.score <= 3;
    });
    document.getElementById("dpmaLowest").innerHTML = m.length > 0 ? m.map(function(e) {
    return "<li>" + e.ax + " (L" + e.score + ")</li>";
    }).join("") : "<li>None — all dimensions are strong!</li>";
    var p = l.filter(function(e) {
    return e.score >= 4;
    }).reverse();
    document.getElementById("dpmaStrengths").innerHTML = p.length > 0 ? p.map(function(e) {
    return "<li>" + e.ax + " (L" + e.score + ")</li>";
    }).join("") : "<li>No strengths yet — keep building!</li>";
    var h = l.filter(function(e) {
    return e.score <= 3;
    }), f = "";
    h.length > 0 && (f = '<div class="dpma-recs-title">Recommendations to Advance Your Weakest Dimensions</div>', 
    f += '<div class="dpma-recs">', h.forEach(function(e) {
    var t = s[e.ax] && s[e.ax][e.score];
    if (t) {
      var i = a[e.ax] || [], n = i[e.score - 1] || "", o = i[e.score] || "";
      f += '<div class="dpma-rec"><div class="dpma-rec-dim">' + e.ax + ' <span class="dpma-rec-badge">L' + e.score + " (" + n + ") &rarr; L" + (e.score + 1) + " (" + o + ')</span></div><div class="dpma-rec-text">' + t + "</div></div>";
    }
    }), f += "</div>"), document.getElementById("dpmaRecs").innerHTML = f, document.getElementById("dpma-questions").style.display = "none", 
    document.getElementById("dpma-results").style.display = "block";
    var y = document.querySelector(".dpma-progress");
    y && (y.style.display = "none");
    var b, w = document.getElementById("assessment-head");
    if (w && (w.style.display = "none"), window.history && window.history.replaceState) {
    var x = new URL(window.location);
    x.searchParams.set("result", u(o)), window.history.replaceState({}, "", x);
    }
    c = new Set(e), (b = document.getElementById("dpmaTabs")) && (b.innerHTML = "", 
    e.forEach(function(a) {
    var i = document.createElement("button");
    i.className = "dpma-tab" + (c.has(a) ? " active" : ""), i.innerHTML = '<span class="dpma-tab-dot"></span>' + t[e.indexOf(a)], 
    i.addEventListener("click", function() {
      c.has(a) ? c.size > 1 && c.delete(a) : c.add(a), this.classList.toggle("active", c.has(a)), 
      v();
    }), b.appendChild(i);
    })), setTimeout(function() {
    v(), function(e) {
      var t = document.getElementById("dpmaDonut");
      if (t) {
      var a = d(t, 110, 110), i = .42 * Math.min(110, 110), n = .6 * i, s = (i + n) / 2, o = i - n, r = g();
      a.beginPath(), a.arc(55, 55, s, 0, 2 * Math.PI), a.strokeStyle = "#2a2a2a", a.lineWidth = o, 
      a.stroke();
      var c = -Math.PI / 2, l = c + e / 100 * Math.PI * 2;
      a.beginPath(), a.arc(55, 55, s, c, l), a.strokeStyle = r, a.lineWidth = o, a.lineCap = "round", 
      a.stroke();
      }
    }(r.pct);
    }, 120);
    
    setTimeout(function() {
      if (typeof submitAssessmentData === 'function') {
        submitAssessmentData();
      }
    }, 2000);
  }
  function w() {
    var e = new URL(window.location);
    return e.searchParams.set("result", u(o)), e.toString();
  }
  function x(e) {
    var t = document.createElement("textarea");
    t.value = e, t.style.position = "fixed", t.style.opacity = "0", document.body.appendChild(t), 
    t.select();
    try {
    document.execCommand("copy"), k("Link copied to clipboard!");
    } catch (e) {
    k("Could not copy — try manually");
    }
    document.body.removeChild(t);
  }
  function k(e) {
    var t = document.getElementById("dpmaToast");
    t && (t.textContent = e, t.classList.add("show"), clearTimeout(t._timer), t._timer = setTimeout(function() {
    t.classList.remove("show");
    }, 2800));
  }
  function A() {
    (function() {
    var t = document.getElementById("dpma-questions");
    if (t) {
      var n = "";
      i.forEach(function(t, i) {
      var s = 0 === i, o = 8 === i;
      n += '<div class="dpma-qcard' + (s ? " active" : "") + '" data-q="' + i + '">', 
      n += '<div class="dpma-qlayout"><div class="dpma-qcontent">', n += '<div class="dpma-qcat">' + t.cat + "</div>", 
      n += '<div class="dpma-qnum">' + (i + 1 < 10 ? "0" : "") + (i + 1) + " / 09</div>", 
      n += '<div class="dpma-qtext">' + t.text + "</div>", n += '<div class="dpma-options">';
      var r = e[i], c = a[r] || [];
      t.opts.forEach(function(e, t) {
        var a = c[t] || "";
        n += '<div class="dpma-opt" data-val="' + (t + 1) + '">', n += '<div class="dpma-opt-radio"></div>', 
        n += '<span class="dpma-opt-score">L' + (t + 1) + "</span>", n += '<span class="dpma-opt-text"><strong>' + a + ":</strong> " + e + "</span></div>";
      }), n += "</div>", n += '<div class="dpma-qnav">', n += '<button class="dpma-btn dpma-btn-prev button is-maturity is-secondary"' + (s ? " disabled" : "") + ">&#8592; Back</button>", 
      n += '<button class="dpma-btn dpma-btn-next ' + (o ? "dpma-submit " : "") + 'button is-maturity" disabled>' + (o ? "View Results &#8594;" : "Next &#8594;") + "</button>", 
      n += "</div></div>", n += '<div class="dpma-radar-panel"><div class="dpma-radar-label">Maturity Fingerprint</div>', 
      n += '<canvas class="dpma-mini-radar" width="260" height="240"></canvas></div>', 
      n += "</div></div>";
      }), t.innerHTML = n, document.querySelectorAll(".dpma-qcard").forEach(function(e, t) {
      e.querySelectorAll(".dpma-opt").forEach(function(a) {
        a.addEventListener("click", function() {
        e.querySelectorAll(".dpma-opt").forEach(function(e) {
          e.classList.remove("selected");
        }), this.classList.add("selected"), o[t] = parseInt(this.getAttribute("data-val"));
        window.DPMA_answers = o;
        e.querySelector(".dpma-btn-next").disabled = !1, h(), y();
        });
      }), e.querySelector(".dpma-btn-prev").addEventListener("click", function() {
        r > 0 && p(--r);
      }), e.querySelector(".dpma-btn-next").addEventListener("click", function() {
        this.classList.contains("dpma-submit") ? b() : p(++r);
      });
      });
    }
    })(), function() {
    var e = new URLSearchParams(window.location.search).get("result");
    if (!e) return !1;
    var t = m(e);
    return !!t && (o = t, window.DPMA_answers = o, !0);
    }() ? (b(), setTimeout(function() {
    var e = document.querySelector(l);
    e && e.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
    }, 300)) : (p(0), h(), y());
  }
  return "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", A) : A(), 
  {
    retake: function() {
    o = new Array(9).fill(null), window.DPMA_answers = o, r = 0, c = new Set(e), document.querySelectorAll(".dpma-qcard").forEach(function(e) {
      e.querySelectorAll(".dpma-opt").forEach(function(e) {
      e.classList.remove("selected");
      });
      var t = e.querySelector(".dpma-btn-next");
      t && (t.disabled = !0);
    }), document.getElementById("dpma-questions").style.display = "block", document.getElementById("dpma-results").style.display = "none";
    var t = document.querySelector(".dpma-progress");
    t && (t.style.display = "");
    var a = document.getElementById("assessment-head");
    if (a && (a.style.display = ""), p(0), h(), window.history && window.history.replaceState) {
      var i = new URL(window.location);
      i.searchParams.delete("result"), window.history.replaceState({}, "", i);
    }
    },
    copyLink: function() {
    var e = w();
    navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(e).then(function() {
      k("Link copied to clipboard!");
    }).catch(function() {
      x(e);
    }) : x(e);
    },
    downloadPDF: function() {
    if (document.getElementById("dpma-results-inner")) {
      k("Generating report...");
      var t = document.createElement("canvas");
      t.width = 920, t.height = 840;
      var i = t.getContext("2d");
      i.fillStyle = "#0A0A0A", i.fillRect(0, 0, 920, 840), i.scale(2, 2), f(i, 460, 420, .36 * Math.min(460, 420), {
      cyOffset: 10,
      labelPad: 34,
      labelSize: 14,
      dotSize: 6,
      lineW: 3,
      showLevelLabels: !0,
      forceActiveLabels: !0,
      activeCheck: function() {
        return !0;
      },
      valFn: function(e) {
        return o[e] || 0;
      }
      });
      var r = t.toDataURL("image/png"), c = Math.min.apply(null, o.map(function(e) {
      return e || 1;
      })), l = n[c], d = e.map(function(e, t) {
      return {
        ax: e,
        score: o[t] || 1
      };
      }).sort(function(e, t) {
      return e.score - t.score;
      }), u = d.filter(function(e) {
      return e.score <= 3;
      }), m = d.filter(function(e) {
      return e.score >= 4;
      }).reverse(), p = d.filter(function(e) {
      return e.score <= 3;
      }), h = w(), g = (new Date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric"
      }), y = (window.location.origin, window.location.pathname, l.pct), v = 2 * Math.PI * 42, b = '<svg width="110" height="110" viewBox="0 0 110 110" style="display:block;margin:0 auto"><circle cx="55" cy="55" r="42" fill="none" stroke="#2a2a2a" stroke-width="12"/><circle cx="55" cy="55" r="42" fill="none" stroke="#E8884A" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + y / 100 * v + " " + v + '" transform="rotate(-90 55 55)"/><text x="55" y="55" text-anchor="middle" dominant-baseline="central" fill="#F5F0EB" font-family="Georgia,serif" font-size="20">' + y + "%</text></svg>", x = "";
      e.forEach(function(e, t) {
      var a = o[t] || 1, i = Math.round(a / 5 * 100);
      x += '<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #222"><span style="flex:0 0 200px;font-size:13px;color:#B0A89E">' + e + '</span><span style="flex:1;height:4px;background:#222;border-radius:2px;position:relative;overflow:hidden"><span style="position:absolute;left:0;top:0;height:100%;width:' + i + '%;background:#E8884A;border-radius:2px"></span></span><span style="flex:0 0 28px;font-size:12px;font-weight:700;color:#E8884A;text-align:right">L' + a + "</span></div>";
      });
      var A = m.length > 0 ? m.map(function(e) {
      return '<li style="font-size:13px;color:#B0A89E;line-height:1.6">' + e.ax + " (L" + e.score + ")</li>";
      }).join("") : '<li style="font-size:13px;color:#B0A89E;line-height:1.6">No strengths yet — keep building!</li>', S = "";
      p.length > 0 && p.forEach(function(e) {
      var t = s[e.ax] && s[e.ax][e.score];
      if (t) {
        var i = a[e.ax] || [], n = i[e.score - 1] || "", o = i[e.score] || "";
        S += '<div style="padding:14px 0;border-bottom:1px solid #222"><div style="font-size:12px;font-weight:700;color:#E8884A;margin-bottom:4px;display:flex;align-items:center;gap:8px">' + e.ax + '<span style="background:rgba(232,136,74,.08);border:1px solid rgba(232,136,74,.18);color:#E8884A;font-size:9px;padding:2px 8px;letter-spacing:1px">L' + e.score + " (" + n + ") &rarr; L" + (e.score + 1) + " (" + o + ')</span></div><div style="font-size:13px;color:#B0A89E;line-height:1.7">' + t + "</div></div>";
      }
      });
      var D = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Data Product Maturity Assessment — Results</title><style>*{margin:0;padding:0;box-sizing:border-box}html,body{background:#0A0A0A;min-height:100%;color:#F5F0EB;font-family:"Century Gothic",Verdana,sans-serif;-webkit-font-smoothing:antialiased;line-height:1.5}.wrap{max-width:720px;margin:0 auto;padding:48px 32px 60px;color:#F5F0EB!important}.wrap h1{font-family:Georgia,serif;font-size:36px;line-height:1.15;margin-bottom:6px;color:#F5F0EB!important}.wrap h1 span{color:#E8884A!important}.date{font-size:12px;color:#B0A89E!important;margin-bottom:32px}.divider{height:1px;background:#E8884A;margin-bottom:32px}.level-row{display:flex;align-items:center;gap:20px;margin-bottom:32px}.level-box{background:#161616;border:1px solid #222;padding:20px 28px;flex:1}.level-num{font-family:Georgia,serif;font-size:16px;letter-spacing:2px;margin-bottom:8px;color:#F5F0EB!important}.level-badge{background:#E8884A;color:#000!important;font-family:Georgia,serif;font-size:20px;font-weight:700;padding:8px 24px;display:inline-block}.donut-wrap{flex:0 0 110px}.radar-wrap{text-align:center;margin-bottom:32px}.radar-wrap img{width:100%;max-width:460px;height:auto}.section{margin-bottom:28px}.section-title{font-family:Georgia,serif;font-size:16px;font-weight:700;margin-bottom:12px;color:#F5F0EB!important}.means-box{background:#161616;border:1px solid #222;border-left:3px solid #E8884A;padding:18px 22px}.means-box p{font-size:13px;color:#B0A89E!important;line-height:1.7}.bd-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.bd-card{background:#161616;border:1px solid #222;padding:18px}.bd-card-title{font-size:13px;font-weight:800;margin-bottom:10px}.bd-lowest{list-style:disc;padding-left:18px;display:flex;flex-direction:column;gap:5px}.bd-lowest li{font-size:12px;color:#B0A89E!important;line-height:1.45;font-weight:400}.strengths{list-style:disc;padding-left:18px;display:flex;flex-direction:column;gap:5px}.recs-box{background:#161616;border:1px solid #222;border-left:3px solid #E8884A;padding:20px}.recs-title{font-size:14px;font-weight:800;margin-bottom:14px;letter-spacing:.5px;color:#F5F0EB!important}.scores-box{background:#161616;border:1px solid #222;padding:20px}.share-section{background:#161616;border:1px solid #222;padding:20px 22px;margin-top:32px}.share-label{font-size:13px;color:#B0A89E!important;margin-bottom:6px}.share-link{font-size:12px;color:#E8884A!important;word-break:break-all;text-decoration:none}.share-link:hover{text-decoration:underline}.branding{display:flex;align-items:center;gap:14px;margin-top:40px;padding-top:24px;border-top:1px solid #222}.branding img{width:125px;height:43px;object-fit:contain}.branding-text{font-size:11px;color:#6B635C!important;line-height:1.5}.branding-text a{color:#E8884A!important;text-decoration:none}.branding-text a:hover{text-decoration:underline}@media print{body{background:#0A0A0A;-webkit-print-color-adjust:exact;print-color-adjust:exact}.wrap{padding:24px}}@media(max-width:600px){.bd-grid{grid-template-columns:1fr}.level-row{flex-wrap:wrap}}</style></head><body><div class="wrap">';
      D += "<h1>Your Data Product Maturity <span>Assessment</span></h1>", D += '<div class="date">Generated ' + g + "</div>", 
      D += '<div class="divider"></div>', D += '<div class="level-row"><div class="level-box">', 
      D += '<div class="level-num">' + l.num + "</div>", D += '<div class="level-badge">' + l.name + "</div>", 
      D += '</div><div class="donut-wrap">' + b + "</div></div>", D += '<div class="section"><div class="section-title">What this means for your organisation</div>', 
      D += '<div class="means-box"><p>' + l.desc + "</p></div></div>", D += '<div class="radar-wrap"><img src="' + r + '" alt="Maturity Fingerprint Radar"></div>', 
      D += '<div class="section"><div class="section-title">Dimension Scores</div>', D += '<div class="scores-box">' + x + "</div></div>", 
      D += '<div class="section"><div class="section-title">Dimension breakdown at a glance</div>', 
      D += '<div class="bd-grid">', D += '<div class="bd-card"><div class="bd-card-title" style="color:#E8884A">Weakest Dimensions &#9888;&#65039;</div>', 
      D += '<ul class="bd-lowest">' + (u.length > 0 ? u.map(function(e) {
      return "<li>" + e.ax + " (L" + e.score + ")</li>";
      }).join("") : "<li>None — all dimensions are strong!</li>") + "</ul></div>", D += '<div class="bd-card"><div class="bd-card-title" style="color:#8BC34A">Your Strengths &#128170;</div>', 
      D += '<ul class="strengths">' + A + "</ul></div>", D += "</div></div>", S && (D += '<div class="section"><div class="section-title">Recommendations to Advance Your Weakest Dimensions</div>', 
      D += '<div class="recs-box">' + S + "</div></div>"), D += '<div class="share-section">', 
      D += '<div class="share-label">View your results or retake the assessment at</div>', 
      D += '<a class="share-link" href="' + h + '" target="_blank">' + h + "</a>", D += "</div>", 
      D += '<div class="branding">', D += '<img src="https://cdn.prod.website-files.com/6538b3836b3dce952f05ff81/69c176b77aa84ff24e1ed1ec_MD101%20LOGO%20White%201.png" alt="Modern Data 101">', 
      D += '<div class="branding-text">An initiative by Modern Data 101<br>', D += '<a href="https://moderndata101.com/data-product-maturity" target="_blank">moderndata101.com/data-product-maturity</a></div>', 
      D += "</body></html>";

      // Render in a hidden off-screen iframe (srcdoc = same-origin, no popup needed)
      var pdfIframe = document.createElement("iframe");
      pdfIframe.style.cssText = "position:fixed;left:-9999px;top:0;width:760px;height:2px;border:none;visibility:hidden;";
      document.body.appendChild(pdfIframe);
      pdfIframe.srcdoc = D;

      pdfIframe.addEventListener("load", function() {
        setTimeout(function() {
          dpmaPdfLibsPromise.then(function() {
            var wrap = pdfIframe.contentDocument && pdfIframe.contentDocument.querySelector(".wrap");
            if (!wrap || !window.html2canvas || !window.jspdf || !window.jspdf.jsPDF) {
              document.body.removeChild(pdfIframe);
              k("Could not generate PDF — try again");
              return;
            }
            // Expand iframe to full content height so nothing is clipped
            pdfIframe.style.height = (pdfIframe.contentDocument.body.scrollHeight + 50) + "px";

            return window.html2canvas(wrap, {
              backgroundColor: "#0A0A0A",
              scale: 2,
              useCORS: true,
              allowTaint: false,
              logging: false,
              windowWidth: 760
            }).then(function(canvas) {
              document.body.removeChild(pdfIframe);
              var imgData = canvas.toDataURL("image/png");
              var pw = 210;
              var scl = pw / wrap.offsetWidth;
              var imgH = (canvas.height * pw) / canvas.width;
              var pdf = new window.jspdf.jsPDF("p", "mm", [pw, imgH]);
              pdf.addImage(imgData, "PNG", 0, 0, pw, imgH);
              // Preserve clickable links in the PDF
              wrap.querySelectorAll("a[href]").forEach(function(a) {
                var ar = a.getBoundingClientRect();
                var wr = wrap.getBoundingClientRect();
                pdf.link((ar.left - wr.left) * scl, (ar.top - wr.top) * scl, ar.width * scl, ar.height * scl, { url: a.href });
              });
              var blob = pdf.output("blob");
              var url = URL.createObjectURL(blob);
              var link = document.createElement("a");
              link.href = url;
              link.download = "data-product-maturity-assessment.pdf";
              link.style.display = "none";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              setTimeout(function() { URL.revokeObjectURL(url); }, 1500);
              k("PDF downloaded!");
            });
          }).catch(function() {
            if (document.body.contains(pdfIframe)) document.body.removeChild(pdfIframe);
            k("Could not generate PDF — try again");
          });
        }, 400);
      }, { once: true });
    } else k("No results to export");
    },
    encodeAnswers: u,
    decodeAnswers: m
  };
  }();
