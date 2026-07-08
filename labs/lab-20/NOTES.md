# Lab 20 — microfake (deepfakes from first principles)

Instructor notes + incremental build plan. Student-facing page: `microfake.html`.

## Vision
A "microgpt for deepfakes" (cf. `labs/lab-02/microgpt.html`): build the generative
machinery from first principles, with hand-traceable toy numbers and in-browser
runnable demos. Cover the **full arc** (autoencoder → GAN → diffusion), both a
**2D toy** and a **tiny 8×8 image** runnable demo, and a **runnable toy video**
generator. Match lab-02 in length and detail.

## Pedagogical spine
Three families in invented order, each fixing the previous one's flaw:
1. **Autoencoder** — reconstruct your own input; swap decoders to swap identity (the 2017 face-swap).
2. **GAN** — generator vs discriminator minimax; sharper but unstable / mode collapse.
3. **Diffusion** — add noise, learn to reverse it; stable + high quality; the modern frontier. This is the implemented spine.
Then **§5 video** = add the time axis (temporal consistency, motion, temporal attention) → runnable toy video.
Then **§6 detection** = the defender's turn (frequency artifacts, density gaps, learned detectors, the arms race).

## The 2D "Try it" demo (DONE)
Real DDIM diffusion sampling with an **exact closed-form denoiser**: the data is a
Gaussian mixture on the points of a target shape (smiley / spiral / two-moons), so
`E[x0 | x_t]` = responsibility-weighted mean of the data points. No trained weights.
DDIM update `x ← x0hat + (σ_next/σ)·(x − x0hat)`. Verified: avg dist-to-shape ≈ 0.01
(≤ 3·S0) even at 20 steps. Optional stochastic "churn" toggle (Langevin-ish).
This demo is the bridge: real models must **learn** this denoiser (§4).

## Build status
- [x] Scaffold: head (shared base + KaTeX + Prism), TOC (full arc), hero/lede/cite, glossary infra, footer.
- [x] Try-it: 2D diffusion sampler (`viz.js` initDiffusionDemo). Verified.
- [x] §1 What is a generative model? — full content (p(x), sampling vs density, latent space, 3-family roadmap table, TPS).
- [x] §2 Autoencoder — DONE. Objective (reconstruct own input, no labels) + bottleneck/manifold; live-trained 2-8-1-8-2 AE widget (real SGD, verified loss 0.80->0.0006); shared-encoder/two-decoder face-swap; 4-pixel hand-traceable toy walkthrough (orthogonal expression/identity subspaces -> exact swap, verified 0 error); face-swap widget (real linear algebra, 8x8); blurry-L2 -> motivates GANs; annotated code + exercise.
- [x] §3 GAN — DONE. Minimax + non-saturating loss; GAN architecture diagram (G/D + feedback loop); LIVE 2D GAN widget (MLP+Adam+through-D gradient, 8-Gaussian ring, D decision-surface heatmap, mode-collapse visible) verified in node (8/8 modes); inline training-loop code + downloadable gan.py (pure stdlib, verified runs); one-G-gradient hand walkthrough; mode collapse + instability; exercise.
  - Also: fixed KaTeX math (display math must live in <p class="eq">, never <pre>/<code> — KaTeX ignores those). Added .eq/.eq-note styles.
  - Also: shipped runnable downloads — gan.py + autoencoder.py (pure stdlib), with download rows in §2 and §3 (the "micro version, fully runnable + fully readable" requirement).
- [x] §4 Diffusion — DONE (clarity-focused). The asymmetry (destroy=free, create=hard); forward process x=x0+σε with a forward-noising 8×8 widget; the regression objective ||D(x,σ)-x0||² and WHY it's stable (no adversary, no mode collapse — the "why diffusion won" point); DDIM reverse = the top demo; LEARNED-denoiser widget (train live then generate, EDM preconditioning) verified in node (avg sample dist 0.038); score-function bridge; one-noise-step + one-DDIM-step hand walkthrough; what-scales-it (U-Net, latent diffusion = stacks on §2, text conditioning); downloadable diffusion.py (pure stdlib, verified avg 0.054 @4k iters); TPS (why many steps) + exercise (what the denoiser stores).
  - NOTE: kept §4 to the 2D LEARNED denoiser for clarity + tractability (live-trainable, verified). The tiny 8×8 *generation* model (offline-trained weights + JS sampler, the full microgpt model.json payoff) is still worth adding as a §4 capstone — deferred. Forward-noising is already shown on an 8×8 image.
- [x] §5 Video — DONE (clarity-focused). Video = one sample from p(video), not 24 from p(image); the flicker problem (independence); runnable side-by-side widget (same motion, naive fresh-noise-per-frame vs consistent shared-noise — isolates the single cause/fix); content-vs-motion split (ties to §2); temporal-attention architecture diagram (per-frame spatial stacks + cross-frame dashed attention); what-scales-it (latent video diffusion, space-time patches/Sora, conditioning); TPS (why long video is hard) + exercise; downloadable video.py (pure stdlib, verified: naive flicker 0.099 vs consistent 0.044).
- [x] §6 Detection — DONE (clarity-focused). Generators leave fingerprints; runnable FFT widget (faint upsampling checkerboard invisible in pixels but a spectral spike — node-verified ~130x peak / 7.5x hi-freq ratio); physical/physiological tells; temporal tells (ties to §5 flicker / video.py); likelihood detector via the §4 denoiser; learned detectors + the generalization arms race; honest conclusion (provenance/C2PA/SynthID beats passive detection — defense-in-depth, the course spine); downloadable detect.py (pure stdlib, verified real->real / fake->FAKE); TPS (detector blind spot) + exercise (generator-as-detector is doomed against a strong generator).
- [x] Assignment + autograder — DONE. "Complete the micro-diffusion model": template `microfake.py` with the two conceptual-heart functions stubbed (precond_target = EDM regression target; ddim_step = reverse sampling step); `test_microfake.py` autograder (2 exact-value unit tests + boundary case + lenient end-to-end generation test, ~29s); `solution/microfake.py` reference (passes 4/4). Part 2 reflection ties build → §6 detection/arms race; bonus (new shape / fewer steps / churn). Rubric to 100 + bonus. Verified: solution passes 4/4, stubbed template fails 0/4 cleanly.

## STATUS: all six teaching sections + assignment COMPLETE. 8 verified pure-stdlib .py (autoencoder, gan, diffusion, video, detect, microfake template + solution, test_microfake). 0 WIP markers. All checks green (JS, IDs, anchors, glossary, math-not-in-pre/code, tag balance).
Possible future polish: tiny 8×8 *generation* model w/ shipped weights (the full microgpt model.json payoff — §4 currently does forward-noising on 8×8 + learned generation in 2D); expand FAQ; wire the lab into labs.html / schedule.html index.

## HPC face-swap companion (PyTorch, real faces) — ADDED 2026-07-07
The §2 face-swap realized on real images, for students to run on the UVA HPC cluster.
- `faceswap.py` — shared encoder + two identity decoders (the 2017 deepfake AE), ~180 readable lines. Device-agnostic (CUDA if present, else CPU ~1 min). Args: `--a`/`--b` (subjects 0-39), `--steps` (3000), `--noise` (0.5), `--zdim` (128), `--out`.
- `faces_all.npz` (1.4 MB, shipped) — 40 Olivetti faces, 64×64 uint8, public-domain research set. Chosen over scraping real modern identities (ethics + redistributable + turn-key/offline). Built via `prep_faces.py` (sklearn `fetch_olivetti_faces`). Default swap pair 7 (woman) <-> 21 (man) = maximally distinct.
- `run_faceswap.slurm` — sbatch job, `--account=ds6042 --partition=gpu --gres=gpu:1`. PyTorch via the pre-built NGC container module (`module load apptainer/1.4.5 pytorch/2.11.0`; run `apptainer exec --nv $CONTAINERDIR/pytorch-2.11.0.sif python ...`). NO pip install.
- `results.png` (shipped example) — 6 rows: A orig / A recon / A→B SWAP || B orig / B recon / B→A SWAP.
- `README-faceswap.md` — turn-key student steps (sbatch → squeue → scp).
- KEY design fix: latent noise during training (`--noise`, the `code()` fn). Without it each decoder memorizes its own identity's exact codes (recon loss → 0) and the cross-identity swap lands out-of-distribution → grainy static. The jitter forces each decoder to handle a neighborhood of codes → clean swaps. Verified on RTX 3090/a6000/rtxpro6000.
- HPC facts (verified 2026-07-07): login default python3 = 3.6.8 (OK — lab is stdlib); modern python via `module load miniforge/26.3.2` = 3.13.13; torch only via the apptainer/pytorch container (import OOMs on the login node — compute node only). Allocation account = `ds6042`. GPU partitions: `gpu` (a6000/v100), `interactive` (rtx, 12h).
- STILL TODO: wire this into microfake.html §2 as a "Going Further — run it on real faces (HPC)" subsection (currently code+data+README only, not surfaced in the HTML lab page).

## diffusion.py runtime fix — 2026-07-07
Added `--iters` CLI (stdlib argparse); default 12000 → 6000. Convergence sweep (local): 3k→avg 0.068, 4k→0.060, 6k→0.050, 12k→0.027. 6k halves runtime (~265s local, ~2× that on the shared login node) at a quality comparable to the originally-verified bar (~0.054 @4k); tunable up for a crisp fit. Motivation: 12k pure-Python (~9 min local, ~15+ min on login node) is bad login-node etiquette + poor student UX. Comment tells students to bump `--iters` on a compute node for sharper samples.

## Whole-lab HPC verification — 2026-07-07
All stdlib deliverables run clean on the cluster on BOTH system python 3.6.8 and miniforge 3.13.13: autograder 4/4 vs solution, 0/4 vs template; autoencoder/video/detect fast; gan ~4 min on login node (borderline — prefer compute node), diffusion now 6k default. Best-case seamlessness: the stdlib lab needs zero `module load` / zero install on the cluster's default python.

## Full real-face arms-race arc + in-page handoffs — ADDED 2026-07-07
Pedagogy: lecture the idea, then students run a real-image PyTorch version on HPC. Each §2-6 has a "Now you run it · (HPC)" handoff (`.callout.hpc-run`, styled in styles.css; lecture beat + copy-paste `sbatch run_hpc.slurm <script>` + "what to look for" + example PNG + downloads). All on the SAME shipped Olivetti faces so the arc closes.
- §2 `faceswap.py` — shared encoder + 2 decoders (done earlier).
- §3 `gan_faces.py` — DCGAN generates faces; saves gan_fakes.npz. Verified: 16 diverse faces, no collapse.
- §4 `diffusion_faces.py` — EDM diffusion generates faces; saves diff_fakes.npz. NEEDED a real residual U-Net (GroupNorm + ResBlocks + 8×8 self-attention) + EMA + zero-mean/unit-var standardization + Heun sampler to stop producing mud; final loss 0.089, samples clearly face-like (v1-v3 with a plain conv stack were muddy — the missing piece was normalization+residual+attention, NOT more steps).
- §5 `video_faces.py` — trains an AE, renders a face-morph two ways: consistent trajectory vs per-frame independent noise. Verified flicker 0.038 vs 0.111 (2.9×). Ships clip_consistent.png / clip_naive.png.
- §6 `detect_faces.py` — CNN real-vs-fake; trains on GAN fakes, tests on unseen diffusion fakes. Verified: 98.8% in-generator, 50.6% (chance) cross-generator — the arms-race generalization gap. Saves spectra.png (real vs fake avg FFT, fake shows hi-freq fingerprint).
- `run_hpc.slurm` — generic GPU runner: `sbatch run_hpc.slurm <script> [args]` -> `apptainer exec --nv $CONTAINERDIR/pytorch-2.11.0.sif python <script> ...`. Account ds6042.
- Example PNGs (results/gan_samples/diff_samples/clip_*/spectra) shipped in the folder and shown in the handoff blocks. HTML cache-bust: styles.css?v=7, viz.js?v=8.

## §4 learned-denoiser WIDGET fix (in-browser) — 2026-07-07
User reported the "train, then generate" widget produced a scattered blob, not the ring. Root cause: converged far too slowly — it lumped 160 samples into ONE Adam step (96k iters = only 600 optimizer updates; avg-dist-to-ring stuck ~0.25-0.31 at realistic interaction time). Fix (viz.js initLearnedDiffusion): (1) 10 small-batch Adam steps of batch 16 per frame instead of one batch-160 step (10× the updates, same compute); (2) EDM log-normal sigma sampling (P_mean −1.2, P_std 1.2) instead of log-uniform; (3) lr 2e-3 → 5e-3. Node-verified convergence: 2s→0.067, 4s→0.050, 6s→0.043 (was 0.25+). Caption "~10–20 seconds" → "a few seconds".

## Conventions / reminders
- Shared-base chrome (`.toc`/`.toc-title`/`.toc-foot`, present toggle wired by lab-base.js, glossary pattern) — NOT lab-02's bespoke `.layout`/`.meta`.
- KaTeX `$...$` / `$$...$$` for math (loaded in head).
- Cache-bust `?v=N` on styles.css / viz.js after every edit.
- Per CLAUDE.md jargon rule: the audience knows ML; gloss the generative-specific terms (latent-space, denoiser, score-function, generative-model) — already seeded in `viz.js` GLOSSARY.
- Each shipped widget that does real numerics MUST be node-verified before "done" (the 2D demo was).
- Toy-walkthrough principle: pin weights to small hand-chosen numbers reused across every diagram (cf. microgpt's TOY_W).
- Real trained weights for §4/§5 demos: train offline, export `model.json`, verify the JS sampler reproduces it.
