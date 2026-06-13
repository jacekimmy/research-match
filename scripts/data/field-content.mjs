// Hand-authored per-field content for the /research pages. Written by Claude
// (not LLM-generated at build time) for quality and genuine field-to-field
// difference. Loaded into field_content by scripts/seo-load-content.mjs.
//
// Grounded in the real subfields/topics that the OpenAlex fetch surfaced for
// each field. The professor TABLE on each page comes from field_professors
// (live data); this content is the field-specific overview, email angle, and FAQ.

export const FIELD_CONTENT = [
  {
    field_slug: "neuroscience",
    field_name: "Neuroscience",
    meta_title: "How to Get a Neuroscience Research Position",
    meta_description:
      "Find neuroscience professors who are publishing right now, see what they study, and email them a short, specific note that actually gets a reply.",
    remote_friendly: "mixed",
    research_overview:
      "Neuroscience asks how the brain produces behavior, memory, and disease. Labs split across a few camps: systems and cognitive neuroscience that maps neural dynamics and functional brain connectivity, usually with fMRI or EEG; molecular and cellular work on neurotransmitter receptors and how single cells signal; and clinical research on disorders like Alzheimer's and Parkinson's. Day to day, the field is genuinely mixed. Imaging and modeling labs live in code and large datasets, so you can contribute remotely. Wet-lab and animal labs need you at the bench or rig in person. Read a professor's recent papers first to tell which kind of lab you are emailing.",
    email_angle:
      "Before you email, figure out whether the lab is computational or wet-lab, because your offer should match. For an imaging or modeling lab (think functional connectivity or neural dynamics), say you can help analyze data and name a real skill: Python, MATLAB, R, or experience with fMRI or EEG pipelines. For a wet-lab or animal lab, offer to be on-site and learn their techniques, and stress that you are careful and reliable with protocols. In both cases, point to one specific recent paper and ask one concrete question about it. Keep it under 150 words and never call the work groundbreaking.",
    faq: [
      { question: "What qualifications do I need for neuroscience research?", answer: "Most labs want coursework in biology, psychology, or neuroscience, plus one concrete skill. For computational labs that means programming or statistics; for wet labs it means basic lab technique or a willingness to be trained. Prior research is a plus, not a requirement, for undergraduates." },
      { question: "Can I do neuroscience research remotely?", answer: "Partly. Imaging, modeling, and data-analysis labs can hand you datasets and code to work on from anywhere. Wet-lab and animal-behavior work needs you physically present at the bench or recording rig. Check a professor's recent papers to see which kind of lab it is before you ask." },
      { question: "What should I say when emailing a neuroscience professor?", answer: "Name one recent paper, say what specifically interested you, and offer a matching skill. For a data-heavy lab, mention analysis tools you know; for a wet lab, offer to learn techniques on-site. Ask one real question and keep the whole email short." },
      { question: "When should I apply for neuroscience research positions?", answer: "Email six to ten weeks before the term or summer you want to start, since labs plan rotations and funding ahead. Spring is the busiest window for summer spots. If a professor is full, ask whether a postdoc or grad student in the group needs help." },
    ],
  },
  {
    field_slug: "machine-learning",
    field_name: "Machine Learning",
    meta_title: "How to Get a Machine Learning Research Position",
    meta_description:
      "Find machine learning professors who are actively publishing, understand their work, and send an email that proves you can contribute code, not just enthusiasm.",
    remote_friendly: "remote-friendly",
    research_overview:
      "Machine learning research builds and studies the models behind modern AI. The active areas you will see most are neural networks and deep learning, natural language processing, and the statistics and topic-modeling methods that make models work and stay interpretable. The work is overwhelmingly remote-friendly: it is code, datasets, experiments, and papers, run on shared compute. That is good news for students, because you can prove yourself with a GitHub repo or a clean reproduction of a result instead of needing to be in a specific building. Most labs care far more about whether you can implement and debug than where you sit.",
    email_angle:
      "An ML professor's inbox is full of generic praise, so lead with evidence instead. Offer to contribute remotely with code: reproducing one of their results, running an ablation, or cleaning and analyzing a dataset they work with. Name your real stack (PyTorch, JAX, Python, strong linear algebra) and link a repo or project if you have one. Reference a specific recent paper, ideally on the exact subarea they work in, like NLP or a particular architecture, and ask a sharp technical question about a choice they made. Skip the word passionate. One concrete, verifiable thing you can do is worth more than a paragraph of admiration.",
    faq: [
      { question: "Do I need a strong math background for machine learning research?", answer: "Yes, comfort with linear algebra, probability, and calculus matters more than knowing every model. Most labs also expect solid Python and a deep-learning framework like PyTorch. You do not need publications, but a small project or a clean reproduction of a paper shows you can actually build things." },
      { question: "Can machine learning research be done remotely?", answer: "Almost entirely. The work is code, datasets, and experiments on shared compute, so many students contribute from anywhere. That makes it one of the easiest fields to break into without being on campus. Offer to reproduce a result or run experiments remotely as your first contribution." },
      { question: "What should I include in an email to an ML professor?", answer: "Reference a specific recent paper, name the skills and tools you actually have, and offer a concrete contribution like reproducing a result or running an ablation. Link a GitHub repo if you have one. Ask one precise technical question instead of asking for a position outright." },
      { question: "How do I stand out without prior ML research?", answer: "Build something small and public: reimplement a paper, enter a Kaggle competition, or extend an open-source repo the lab uses. A working project proves more than coursework. Mention it in your first email so the professor can see your skill in thirty seconds." },
    ],
  },
  {
    field_slug: "computational-biology",
    field_name: "Computational Biology",
    meta_title: "How to Get a Computational Biology Research Position",
    meta_description:
      "Find computational biology professors who are actively publishing, learn what they model, and email them an offer to contribute analysis or code remotely.",
    remote_friendly: "remote-friendly",
    research_overview:
      "Computational biology uses code and math to make sense of biological systems. The work clusters around gene regulatory network analysis, modeling how cells make decisions, and the broader bioinformatics and biomedical pipelines that turn raw sequencing into biological meaning. Compared with wet-lab biology, the day-to-day is remote-friendly: you write scripts, build models, and analyze large datasets rather than running experiments at a bench. Many labs are happy to hand a capable student a dataset and a question to work on from anywhere. The strongest applicants pair real biology knowledge with programming, so they can ask whether a model's output actually makes biological sense.",
    email_angle:
      "Computational biology labs value students who can both code and reason about biology, so show both. Offer to take on a piece of analysis remotely: parsing a dataset, reproducing a figure, or prototyping part of a model or pipeline they describe in a recent paper. Name your tools (Python or R, plus pandas, Bioconductor, or scikit-learn) and any biology coursework that lets you interpret results. Point to one specific paper, ideally on network modeling or a genomics method they use, and ask a question that shows you understood the method, not just the abstract. Avoid generic flattery and make your first ask small and doable.",
    faq: [
      { question: "Do I need a biology or a computer science background for computational biology?", answer: "Ideally a bit of both, but you can start from either side. Programming in Python or R is essential; the biology can be learned through coursework or reading. Labs especially value students who can write code and still judge whether a result makes biological sense." },
      { question: "Can computational biology research be done remotely?", answer: "Usually yes. The work is scripting, modeling, and analyzing datasets, so many professors are comfortable assigning a remote project. Wet-lab collaborators generate the data, but your contribution is computational. Offer to take a dataset and a focused question as your first remote task." },
      { question: "What skills should I mention when emailing a computational biology professor?", answer: "List your programming languages and relevant libraries, any statistics or machine learning you know, and biology coursework that helps you interpret results. Then offer a concrete analysis you could do on their data. Specifics about tools beat general claims of being a fast learner." },
      { question: "Is computational biology the same as bioinformatics?", answer: "They overlap heavily and many people use the terms loosely. Bioinformatics leans toward sequence analysis, databases, and pipelines; computational biology leans toward modeling and simulating biological systems. Many labs do both, so read recent papers to see where a specific professor actually focuses." },
    ],
  },
  {
    field_slug: "bioinformatics",
    field_name: "Bioinformatics",
    meta_title: "How to Get a Bioinformatics Research Position",
    meta_description:
      "Find bioinformatics professors who are actively publishing, see what data they work with, and email them a clear offer to help analyze it remotely.",
    remote_friendly: "remote-friendly",
    research_overview:
      "Bioinformatics turns biological data, especially DNA, RNA, and protein sequences, into answers. The active work you will see includes gene-expression analysis and cancer classification, building and querying genomic networks, and the methods and databases that the whole field of genomics depends on. The work is remote-friendly by nature: it runs on code, public datasets, and compute clusters rather than a wet bench. That makes it one of the more accessible fields for a student to join, because a professor can hand you sequencing data and a question without you setting foot in a lab. Knowing the underlying biology is what separates good analysis from output you cannot interpret.",
    email_angle:
      "Bioinformatics professors get plenty of vague emails, so be concrete about the data and tools you can handle. Offer to analyze a dataset remotely, reproduce a figure, or run a standard pipeline (alignment, differential expression, variant calling) on data they work with. Name your stack: Python or R, Bioconductor, Nextflow or Snakemake, and any genomics coursework. Reference one recent paper, ideally on gene expression or a genomic-network method, and ask a question that shows you understood the analysis. Keep the first ask small and verifiable, like one clean analysis, rather than asking for a long-term role up front.",
    faq: [
      { question: "What background do I need for bioinformatics research?", answer: "You need programming, usually Python or R, and enough genetics or molecular biology to interpret results. Statistics helps a lot. You do not need a wet-lab background; many bioinformaticians never run an experiment themselves and instead analyze data others generate." },
      { question: "Can I do bioinformatics research from home?", answer: "Yes, more than almost any biology field. The work is code and data on compute clusters, so professors can assign remote projects easily. Offer to run a specific analysis or pipeline on their data as a low-risk way to prove you can contribute." },
      { question: "What should my first email to a bioinformatics professor say?", answer: "Mention a recent paper and the kind of data it used, name your programming and analysis tools, and offer one concrete analysis you could run. Ask a focused question about their method. Showing you can handle their data type matters more than listing coursework." },
      { question: "How is bioinformatics different from data science?", answer: "Bioinformatics is data science applied to biological data, with domain knowledge baked in. You need to understand sequencing, genomics, and biological context, not just general modeling. Professors look for students who can both run the analysis and judge whether the biology makes sense." },
    ],
  },
  {
    field_slug: "cancer-biology",
    field_name: "Cancer Biology",
    meta_title: "How to Get a Cancer Biology Research Position",
    meta_description:
      "Find cancer biology professors who are actively publishing, learn what drives their research, and email them an offer to work hands-on in the lab.",
    remote_friendly: "hands-on",
    research_overview:
      "Cancer biology studies how normal cells become tumors and how to stop them. The active areas include cancer genomics and diagnostics, the molecular mechanisms and signaling pathways like NF-kB that let tumors grow, and the links between metabolism, lipids, and cancer. Most of this work is hands-on. It depends on cell culture, animal models, and bench assays that have to be done in person, on the lab's schedule. There is a real computational side in the genomics work, but the core of most labs is experimental. If you want in, expect to spend time at the bench learning techniques rather than working from a laptop.",
    email_angle:
      "Cancer biology is mostly wet-lab, so your email should make clear you want to be in the lab and can be trusted there. Say you are looking to contribute on-site, learn techniques like cell culture, Western blots, or flow cytometry, and that you are reliable and careful, which matters when experiments take weeks. Mention any lab experience, even a teaching lab. Reference one recent paper, ideally on a pathway or genomics finding they published, and ask a specific question about it. Volunteering to start with routine bench work shows you understand how labs actually run and lowers the risk of saying yes to you.",
    faq: [
      { question: "Do I need lab experience to join a cancer biology lab?", answer: "It helps but is not always required for undergraduates. Many labs will train a careful, committed student in basic techniques. What they screen for is reliability and genuine interest, since experiments take time and a flaky student wastes reagents and effort. Mention any lab coursework you have." },
      { question: "Can cancer biology research be done remotely?", answer: "Mostly no. The core work is cell culture, animal models, and bench assays that require being physically present. The genomics and data-analysis side can be partly remote, but most labs expect you on-site. Be ready to commit to regular hours in the lab." },
      { question: "What should I say when emailing a cancer biology professor?", answer: "Say you want to contribute in the lab, name techniques you know or want to learn, and stress that you are reliable with protocols. Reference a specific recent paper on their pathway or model and ask one real question. Offering to start with routine bench work signals you understand lab life." },
      { question: "How competitive are cancer biology research positions?", answer: "They can be competitive at well-known labs, partly because the field draws pre-med and PhD-bound students. Your edge is specificity and commitment: a tailored email about their actual work, plus a willingness to put in steady bench hours, beats a polished but generic message every time." },
    ],
  },
  {
    field_slug: "immunology",
    field_name: "Immunology",
    meta_title: "How to Get an Immunology Research Position",
    meta_description:
      "Find immunology professors who are actively publishing, see what they study, and email them an offer to learn bench techniques and contribute in the lab.",
    remote_friendly: "hands-on",
    research_overview:
      "Immunology studies how the body defends itself and what happens when that system misfires. Active areas include immunotherapy and how immune responses can be harnessed against cancer, the biology of inflammation, T-cell and B-cell function, and the roles of interferons and the complement system in disease. The work is largely hands-on. It runs on flow cytometry, cell culture, animal models, and assays that require being in the lab. There is growing computational analysis of immune data, but most labs are built around experiments. Expect to learn techniques at the bench, and to commit real, regular time, since immune experiments often run across several days.",
    email_angle:
      "Immunology is bench-heavy, so signal that you want hands-on time and can be trusted with it. Offer to be in the lab, to learn core techniques like flow cytometry, ELISA, or cell culture, and emphasize that you are meticulous, since immune assays are easy to ruin with sloppy technique. Mention any wet-lab experience. Reference one recent paper, ideally on a topic they actually work on like T-cell biology or immunotherapy, and ask a focused question about a result. Offering to start with routine tasks and to commit consistent hours makes it much easier for a busy professor to say yes to an undergraduate.",
    faq: [
      { question: "What background helps for immunology research?", answer: "Coursework in biology, biochemistry, or immunology, and any wet-lab experience. Knowing techniques like flow cytometry, PCR, or cell culture is a bonus. Most undergraduate-friendly labs will train you, so commitment and care matter more than already knowing every assay." },
      { question: "Can immunology research be done remotely?", answer: "Mostly no. The work centers on experiments, flow cytometry, cell culture, and animal models, that require being in the lab. Some data analysis can happen remotely, but professors generally expect immunology students on-site for regular, scheduled hours." },
      { question: "What should I write in an email to an immunology professor?", answer: "Say you want hands-on lab experience, name techniques you know or want to learn, and stress that you are careful and reliable. Reference a recent paper on their specific area, like immunotherapy or inflammation, and ask one concrete question. Offer to start with routine bench work." },
      { question: "Is immunology good preparation for medical school?", answer: "Yes. Immunology connects directly to disease, vaccines, and treatment, so it is popular with pre-med students and reads well on applications. The bench skills and the habit of reading primary papers also transfer to almost any biomedical path you take later." },
    ],
  },
  {
    field_slug: "genetics",
    field_name: "Genetics",
    meta_title: "How to Get a Genetics Research Position",
    meta_description:
      "Find genetics professors who are actively publishing, learn what they study, and email them an offer to contribute at the bench or with data analysis.",
    remote_friendly: "mixed",
    research_overview:
      "Genetics studies how traits and diseases are inherited and how genomes vary across people and populations. The active work includes genetic associations linking variants to disease and traits, and the study of genetic diversity and population structure. The field is genuinely mixed. One side is wet-lab: sequencing, genotyping, and CRISPR-based experiments done in person. The other is heavily computational: genome-wide association studies, statistical genetics, and population analysis that run entirely in code. That split is good for students, because there is a way in whether you prefer the bench or the keyboard. Read a professor's recent papers to see which side their lab leans toward before you write.",
    email_angle:
      "Genetics labs come in two flavors, so match your offer to the one you are emailing. For a statistical or population-genetics lab, offer to help with data analysis and name your tools, like R, Python, PLINK, or experience with GWAS data. For a wet-lab genetics group, offer to be on-site to learn sequencing prep, genotyping, or CRISPR techniques, and stress your reliability. Either way, reference one recent paper, on an association study or population analysis, for example, and ask a specific question about the method or finding. Keep it short, skip the flattery, and make your first ask concrete and small.",
    faq: [
      { question: "Do I need programming skills for genetics research?", answer: "It depends on the lab. Statistical and population genetics require programming in R or Python and comfort with large datasets. Wet-lab genetics relies more on bench skills like sequencing prep and genotyping. Read recent papers to see which kind of lab you are contacting, then match your pitch." },
      { question: "Can genetics research be done remotely?", answer: "The computational side can. Statistical genetics, GWAS, and population analysis are code and data, so they travel well. Wet-lab genetics, sequencing, genotyping, and CRISPR work, needs you in person. Many labs do both, so ask which part you would contribute to." },
      { question: "What should I say when emailing a genetics professor?", answer: "Identify whether the lab is computational or wet-lab, then offer a matching skill: data analysis tools for the former, a willingness to learn bench techniques for the latter. Reference a specific recent paper and ask a focused question. A tailored, concrete email beats a generic one." },
      { question: "What is the difference between genetics and genomics?", answer: "Genetics usually focuses on individual genes and how traits are inherited; genomics studies whole genomes and large-scale variation at once. The line is blurry and many labs span both. For a research position, what matters more is whether the day-to-day work is wet-lab or computational." },
    ],
  },
  {
    field_slug: "molecular-biology",
    field_name: "Molecular Biology",
    meta_title: "How to Get a Molecular Biology Research Position",
    meta_description:
      "Find molecular biology professors who are actively publishing, learn what they study, and email them an offer to learn bench techniques and help in the lab.",
    remote_friendly: "hands-on",
    research_overview:
      "Molecular biology studies how cells work at the level of DNA, RNA, and proteins. Active areas include gene expression, single-cell and spatial transcriptomics, the genomics of disease, and the growing study of the gut microbiome and health. Most of the work is hands-on, built on cloning, PCR, cell culture, and increasingly single-cell sequencing prep, all done at the bench. There is a strong and growing data-analysis component, especially as sequencing produces huge datasets, but the experiments themselves still happen in person. If you join a molecular biology lab, expect to learn techniques at the bench and to commit regular hours, since protocols often span multiple days.",
    email_angle:
      "Molecular biology is bench-driven, so make clear you want hands-on time and can be relied on. Offer to be in the lab and to learn core techniques like PCR, cloning, cell culture, or sequencing prep, and emphasize that you are careful, since contamination or a mislabeled tube can cost a week. Mention any lab coursework. Reference one recent paper, ideally on something they actually study like transcriptomics or gene expression, and ask a specific question about it. If you also code, mention it, because many labs now welcome help analyzing sequencing data, but lead with your willingness to do the bench work.",
    faq: [
      { question: "What skills do I need for molecular biology research?", answer: "Comfort in a wet lab and care with protocols matter most. Knowing PCR, pipetting, or cell culture helps, but many labs train undergraduates. If you also have data-analysis skills for sequencing data, mention them, as that combination is increasingly valuable." },
      { question: "Can molecular biology research be done remotely?", answer: "Mostly no. The experiments, cloning, PCR, cell culture, sequencing prep, require being at the bench. The analysis of sequencing data can be done remotely, so if a lab generates large datasets there may be a computational way to contribute alongside the bench work." },
      { question: "What should I include in an email to a molecular biology professor?", answer: "Say you want hands-on lab experience, name techniques you know or want to learn, and stress reliability. Reference a recent paper on their topic, such as gene expression or transcriptomics, and ask one real question. If you can analyze data too, mention it as a bonus." },
      { question: "Is molecular biology a good path for pre-med or PhD students?", answer: "Yes. The bench skills, the habit of reading primary literature, and a recommendation letter from a molecular biology professor all strengthen medical and graduate applications. It also gives you a concrete sense of whether you enjoy lab research before you commit to a longer program." },
    ],
  },
  {
    field_slug: "organic-chemistry",
    field_name: "Organic Chemistry",
    meta_title: "How to Get an Organic Chemistry Research Position",
    meta_description:
      "Find organic chemistry professors who are actively publishing, learn what they synthesize, and email them an offer to learn bench techniques on-site.",
    remote_friendly: "hands-on",
    research_overview:
      "Organic chemistry is about building and understanding molecules. Active research areas include advanced polymer synthesis, carbohydrate chemistry, catalytic C-H functionalization, and asymmetric synthesis and catalysis, the methods that let chemists make specific molecules cleanly. This is one of the most hands-on fields in science. The work is done at the bench, running reactions, purifying products, and characterizing them with NMR and other instruments, and it cannot be done from a laptop. There is a computational chemistry side that models reactions, but most synthetic labs are experimental. If you join one, expect long, careful bench sessions and a real focus on technique and safety.",
    email_angle:
      "Synthetic organic chemistry is almost entirely hands-on, so your email should make clear you want bench time and take safety seriously. Offer to be on-site, to learn techniques like running and monitoring reactions, purification, and NMR characterization, and stress that you are careful and methodical, which matters around reactive chemicals. Mention any lab coursework or instrument experience. Reference one recent paper, ideally on a method they actually use like catalysis or polymer synthesis, and ask a specific question about a step or reagent. Offering to start with routine tasks and to commit steady hours signals you understand how a synthesis lab really works.",
    faq: [
      { question: "Do I need experience to join an organic chemistry lab?", answer: "Organic chemistry coursework and a teaching-lab background help, but many groups will train a careful undergraduate. What they screen for is good technique and safety awareness, since reactions can be sensitive and hazardous. Mention any hands-on lab experience, even from classes." },
      { question: "Can organic chemistry research be done remotely?", answer: "Synthetic work, no. Running reactions, purifying compounds, and characterizing them require being at the bench with the instruments. Only the computational chemistry side, modeling reactions and structures, can be done remotely, and that is a smaller part of most synthetic labs." },
      { question: "What should I write to an organic chemistry professor?", answer: "Say you want bench experience, name techniques you know or want to learn, and emphasize that you are careful and safety-conscious. Reference a recent paper on a method they use, like asymmetric catalysis, and ask one specific question. Offer to start with routine lab tasks." },
      { question: "How many hours do organic chemistry research positions require?", answer: "Often more than you expect, because reactions run on their own schedule and purification takes time. Many labs want at least 10 to 15 hours a week so you can see experiments through. Being honest about your availability up front helps a professor decide if it is a fit." },
    ],
  },
  {
    field_slug: "materials-science",
    field_name: "Materials Science",
    meta_title: "How to Get a Materials Science Research Position",
    meta_description:
      "Find materials science professors who are actively publishing, learn what they build, and email them an offer to help in the lab or with modeling.",
    remote_friendly: "mixed",
    research_overview:
      "Materials science designs and studies the substances that everything else is built from. Active areas include graphene and other two-dimensional materials, catalysis, the crystallography and X-ray methods used to characterize structure, and the fast-growing use of machine learning to predict material properties. The field is genuinely mixed. Synthesis and characterization happen hands-on in the lab, with furnaces, deposition tools, and electron microscopes. But a large and growing share of the work is computational: density functional theory, simulations, and machine-learning models of materials. That means there is an entry point whether you prefer lab work or coding, so read a professor's recent papers to see which side their group leans toward.",
    email_angle:
      "Materials labs split between experiment and computation, so aim your offer at the right one. For a computational or machine-learning materials group, offer to help with simulations or data analysis and name your tools, like Python, DFT codes, or experience with materials datasets. For a synthesis or characterization lab, offer to be on-site and learn techniques like sample fabrication, X-ray diffraction, or electron microscopy, and stress your reliability. Either way, reference one recent paper, on graphene or a property-prediction method, for instance, and ask a specific question. Keep it short, skip the praise, and make your first ask a single concrete task.",
    faq: [
      { question: "Is materials science research hands-on or computational?", answer: "Both, depending on the lab. Synthesis and characterization groups work hands-on with furnaces, deposition tools, and microscopes. Computational groups run simulations and machine-learning models of materials. Many labs combine the two, so check recent papers to see where a specific professor focuses before you email." },
      { question: "Can I do materials science research remotely?", answer: "The computational side can be remote, simulations, density functional theory, and machine-learning models run on compute clusters. Synthesis and characterization need you physically in the lab. If you prefer remote work, target groups whose recent papers are clearly computational." },
      { question: "What should I say when emailing a materials science professor?", answer: "Decide whether the lab is experimental or computational, then offer a matching contribution: lab techniques for the former, simulation or data skills for the latter. Reference a recent paper, such as work on graphene or property prediction, and ask one focused question instead of a generic request." },
      { question: "What majors lead into materials science research?", answer: "Physics, chemistry, and engineering are the common routes, but computer science students increasingly contribute through machine-learning work on materials data. What matters is matching your strength, lab technique or coding, to a group that needs it, which you can judge from their recent publications." },
    ],
  },
  {
    field_slug: "psychology",
    field_name: "Psychology",
    meta_title: "How to Get a Psychology Research Position",
    meta_description:
      "Find psychology professors who are actively publishing, see exactly what they study, and email them a specific offer to help run their studies or analyze data.",
    remote_friendly: "mixed",
    research_overview:
      "Psychology studies how people think, feel, develop, and behave. Active areas include child and adolescent psychosocial and emotional development, eating disorders and behavior, and mental health, including how events like the COVID-19 pandemic affected it. The work is mixed. Some of it is hands-on with people: running experiments, interviewing participants, and coding behavior, which happens on campus or in clinics. A large part is data work: designing surveys, cleaning datasets, and running statistics, which you can do remotely. For a student, that mix is an advantage, because labs often need help on both sides. Read recent papers to see whether a professor runs lab studies, field studies, or mainly analyzes data.",
    email_angle:
      "Psychology labs almost always need two things from research assistants: help running studies and help with data. Offer whichever fits you and the lab. If you have statistics or coding skills (R, SPSS, Python), say so and offer to help clean and analyze data remotely. If you are local, offer to help run sessions, recruit participants, or code behavioral data on-site. Reference one recent paper, on development or mental health, for example, and ask a specific question about the design or finding. Mention any research-methods or statistics coursework. Keep it concrete and short, and avoid saying the work is inspiring; show you actually read it.",
    faq: [
      { question: "Do I need statistics skills for psychology research?", answer: "They help a lot. Much of psychology research is designing studies and analyzing data, so knowing R, SPSS, or Python makes you immediately useful. If you lack stats, you can still contribute by helping run studies, recruiting participants, and coding behavioral data, then learn analysis on the job." },
      { question: "Can psychology research be done remotely?", answer: "Often, yes, especially the data side: cleaning datasets, running statistics, and literature reviews travel well. Studies that involve running participant sessions or clinical work usually need you on campus. Many labs split the work, so ask which part you would take on." },
      { question: "What should I include in an email to a psychology professor?", answer: "Mention a recent paper and what interested you, name relevant skills like statistics or study coordination, and offer a concrete way to help. Ask one specific question about the work. Research-methods coursework is worth noting, since labs rely on assistants who understand study design." },
      { question: "How do I get into a psychology lab as a first-year student?", answer: "Email professors whose recent work genuinely interests you and offer to start with the basics: data entry, participant scheduling, or literature searches. Many labs take first-years for exactly these tasks. A specific, well-read email about their research stands out from mass requests." },
    ],
  },
  {
    field_slug: "public-health",
    field_name: "Public Health",
    meta_title: "How to Get a Public Health Research Position",
    meta_description:
      "Find public health professors who are actively publishing, learn what they study, and email them an offer to help with data, reviews, or fieldwork.",
    remote_friendly: "mixed",
    research_overview:
      "Public health studies how to keep populations healthy and how to prevent disease at scale. Active areas include malaria research and control, nutrition and diet, the implementation of clinical practice guidelines, and the links between obesity, physical activity, and health. The work is mixed. Some is field- and clinic-based: collecting data, running interventions, and working with communities. A large share is analytical and can be done remotely: cleaning survey data, running statistics, and conducting systematic reviews. For students, the remote analytical side is often the easiest way in, since professors can assign a literature review or a dataset to work on. Read recent papers to see whether a group is field-heavy or data-heavy.",
    email_angle:
      "Public health professors frequently need help with data and evidence synthesis, which is good news if you are remote. Offer to help with a systematic review, clean and analyze survey or surveillance data, or summarize literature, and name any statistics tools you know (R, Stata, SAS). If you are local and the group does fieldwork, offer to help with data collection or community programs. Reference one recent paper, on nutrition or disease control, for instance, and ask a specific question about the methods or population. Mention epidemiology or statistics coursework. Keep your first ask concrete and modest, like one review or one analysis.",
    faq: [
      { question: "What skills are useful for public health research?", answer: "Statistics and a tool like R, Stata, or SAS go a long way, since much of the work is analyzing data. Skills in literature review and clear writing also help. For field-based projects, organization and communication with communities and participants matter most." },
      { question: "Can public health research be done remotely?", answer: "Often, yes. Data analysis, systematic reviews, and modeling can all be done from anywhere, so many professors assign remote projects. Fieldwork and community interventions need you on location. Target data-heavy groups if you want to contribute remotely." },
      { question: "What should I write to a public health professor?", answer: "Offer a concrete contribution, a systematic review, data cleaning, or analysis, and name your statistics tools. Reference a recent paper on their topic, such as nutrition or disease control, and ask a focused question. Note any epidemiology or statistics coursework you have taken." },
      { question: "Is public health research good for pre-med students?", answer: "Yes. It shows you understand health beyond the individual patient, builds data and writing skills, and often leads to publications or posters. Many pre-med students find population-level work a strong complement to clinical experience on their applications." },
    ],
  },
  {
    field_slug: "epidemiology",
    field_name: "Epidemiology",
    meta_title: "How to Get an Epidemiology Research Position",
    meta_description:
      "Find epidemiology professors who are actively publishing, learn what they study, and email them an offer to help analyze data or run reviews remotely.",
    remote_friendly: "remote-friendly",
    research_overview:
      "Epidemiology studies the patterns and causes of disease in populations. Active areas you will see include cancer and HPV research, stroke management, liver disease, substance abuse outcomes, and infectious disease surveillance. The day-to-day work is largely analytical and remote-friendly: cleaning datasets, running statistical models, and conducting systematic reviews and meta-analyses. Data is usually collected by clinical or field collaborators, and the epidemiologist's job is to make sense of it. That makes the field one of the more accessible for students who can handle data, because a professor can hand you a dataset or a review to work on from anywhere. Strong statistics and careful, honest analysis are what labs value most.",
    email_angle:
      "Epidemiology runs on data and evidence synthesis, so lead with analytical skills. Offer to help with a systematic review or meta-analysis, clean and analyze a dataset, or run statistical models, and name your tools (R, Stata, SAS) and any biostatistics coursework. Reference one recent paper, on disease surveillance or a specific condition they study, and ask a precise question about the methods, like how they handled confounding. Most of this can be done remotely, so make that easy for the professor by proposing a concrete, self-contained task. Skip generic enthusiasm; a clear offer to do one real analysis or review is far more persuasive.",
    faq: [
      { question: "Do I need statistics for epidemiology research?", answer: "Yes, more than almost anything else. Epidemiology is built on biostatistics, so comfort with R, Stata, or SAS and an understanding of study design make you immediately useful. If you are still learning, say so honestly and offer to start with literature reviews while you build the skills." },
      { question: "Can epidemiology research be done remotely?", answer: "Very much so. The core work, data analysis, modeling, and systematic reviews, is computational and travels well. Data collection is usually handled by clinical or field collaborators. This makes epidemiology one of the easiest health fields to contribute to from anywhere." },
      { question: "What should I say in an email to an epidemiology professor?", answer: "Offer a concrete analytical contribution, a review, data cleaning, or modeling, and name your statistics tools and coursework. Reference a recent paper and ask a specific methods question, such as how they controlled for confounding. A precise, data-focused email signals you understand the work." },
      { question: "What is the difference between epidemiology and public health?", answer: "Epidemiology is the research engine, measuring who gets sick and why, while public health is the broader effort to act on that knowledge through policy and programs. They overlap heavily, but epidemiology positions tend to be more data- and statistics-focused than general public health roles." },
    ],
  },
  {
    field_slug: "biomedical-engineering",
    field_name: "Biomedical Engineering",
    meta_title: "How to Get a Biomedical Engineering Research Position",
    meta_description:
      "Find biomedical engineering professors who are actively publishing, learn what they build, and email them an offer to help in the lab or with analysis.",
    remote_friendly: "mixed",
    research_overview:
      "Biomedical engineering applies engineering to medicine and biology. Active areas include medical imaging and radiomics, biomechanics, tissue engineering and biomaterials, and neural engineering that connects devices to the body. The field is genuinely mixed. Device fabrication, tissue work, and experiments happen hands-on in the lab. But a large share of the work, especially imaging analysis, modeling, and machine learning on medical data, is computational and can be done remotely. That breadth is good for students, because a strong programmer and a strong builder can both find a role. Read a professor's recent papers to see whether their group leans toward wet-lab and device work or toward imaging and computation.",
    email_angle:
      "Biomedical engineering spans bench and computer, so match your offer to the group. For an imaging or modeling lab, offer to help analyze medical images or build models and name your tools, like Python, MATLAB, or machine-learning experience. For a tissue-engineering or device lab, offer to be on-site, learn fabrication or testing techniques, and stress reliability. Reference one recent paper, on biomechanics or medical imaging, for example, and ask a specific question about the design or method. Engineering students should mention relevant coursework and any projects. Keep the email short and propose one concrete first task rather than asking for a position outright.",
    faq: [
      { question: "Is biomedical engineering research hands-on or computational?", answer: "It varies by lab. Tissue engineering, biomaterials, and device groups are hands-on; imaging, modeling, and machine-learning-on-medical-data groups are computational. Many labs combine both. Check a professor's recent papers to see which kind of work dominates before you reach out." },
      { question: "Can biomedical engineering research be done remotely?", answer: "The computational side can, image analysis, modeling, and machine learning on medical data are all remote-friendly. Device fabrication, tissue work, and experiments require being in the lab. If you want remote work, target groups whose recent output is clearly computational." },
      { question: "What should I write to a biomedical engineering professor?", answer: "Decide whether the lab is experimental or computational, then offer a matching contribution: lab and fabrication skills, or coding and analysis. Reference a recent paper, such as work on medical imaging or biomechanics, and ask one specific question. Mention relevant engineering coursework and projects." },
      { question: "What major do I need for biomedical engineering research?", answer: "Biomedical, mechanical, electrical, or chemical engineering are common, but biology, physics, and computer science students contribute too, especially on the imaging and modeling side. What matters is matching a real skill, building or coding, to a lab that needs it." },
    ],
  },
  {
    field_slug: "cognitive-science",
    field_name: "Cognitive Science",
    meta_title: "How to Get a Cognitive Science Research Position",
    meta_description:
      "Find cognitive science professors who are actively publishing, learn what they study, and email them an offer to help run experiments or analyze data.",
    remote_friendly: "mixed",
    research_overview:
      "Cognitive science studies the mind, how people learn, reason, remember, and differ from one another. Active areas include cognitive abilities and testing, learning and achievement, the psychometrics of anxiety and depression, and broader mental health research. The work is mixed. Behavioral experiments and testing often happen in person, while designing tasks, cleaning data, and running statistical or computational models can be done remotely. Because the field sits between psychology, neuroscience, and computer science, labs vary widely: some run human experiments, others build computational models of cognition. For a student, that means there is usually a way to contribute whether your strength is working with people or working with data.",
    email_angle:
      "Cognitive science labs typically need help running studies or modeling data, so offer whichever fits. If you can code or do statistics (R, Python, experiment software like PsychoPy), offer to help build tasks or analyze data remotely. If you are local, offer to help run participant sessions and score data on-site. Reference one recent paper, on cognitive testing or a modeling result, for instance, and ask a specific question about the design or analysis. Mention any research-methods, statistics, or programming coursework. Keep it short and concrete, and instead of praising the work, show that you read it and understood the question it asked.",
    faq: [
      { question: "What background helps for cognitive science research?", answer: "It is interdisciplinary, so psychology, neuroscience, computer science, or linguistics all fit. Useful skills include statistics, programming for experiments or modeling, and an understanding of research methods. Labs differ widely, so match your strength, working with people or with data, to what a group actually does." },
      { question: "Can cognitive science research be done remotely?", answer: "Partly. Designing tasks, analyzing data, and building computational models of cognition can be done remotely. Running behavioral experiments with participants usually needs you on campus. Many labs split the work, so ask which part you would take on when you email." },
      { question: "What should I say when emailing a cognitive science professor?", answer: "Offer a concrete contribution, help running studies, or coding and analysis, and name relevant skills like statistics or experiment software. Reference a recent paper and ask a specific question about the design or model. Note any methods or programming coursework you have." },
      { question: "How is cognitive science different from psychology?", answer: "Cognitive science is broader and more interdisciplinary, drawing on computer science, linguistics, and neuroscience alongside psychology, and it leans toward computational models of the mind. Psychology is one of its parent fields. In practice, what matters for a position is whether the lab runs experiments, builds models, or both." },
    ],
  },
];
