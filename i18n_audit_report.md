# Language and audience audit

Pages: rule, atlas, maxwell, furey, shapes, equations, map, ask; audiences: Young Learner, Physicist, Mathematician.

## rule: 87 EN blocks, 87 IT blocks; 0 identical in both languages


## atlas: 170 EN blocks, 170 IT blocks; 4 identical in both languages

- Clifford: Grade 2 bivector inside Cl(3,1)
- Prime: Multiplicity [B+F=4, B-F=+2]
- Simplex: 3-face (4 vertices; a grade-k blade is a (k-1)-face)
- Cube: Q4: 16 vertices; all-ON corner 00001111

## maxwell: 152 EN blocks, 152 IT blocks; 5 identical in both languages

- Cl(1,1) = M2(ℝ) · 2 generators, 4 blades · F: 1 = 1 E · ∇F: 2 + 0 = 2 equations
- Gauss: ∂x Ex = ρ
- algebra Cl(k,1)
- algebra Cl(1,d)
- python3 maxwell_selfcheck.py --compare maxwell.json

## furey: 246 EN blocks, 249 IT blocks; 16 identical in both languages

- 8 vertices = 7-simplex · 256 faces incl. ∅
- 256 vertices · 1024 edges · 6561 faces
- 54 primes among labels 0…255
- replica o→O1
- replica o→O2
- replica o→O3
- replica o→H1
- replica o→H2
- replica o→c
- replica r→H1
- replica r→H2
- python3 dictionary_selfcheck.py --compare dictionary.json
- 0 generations: 5463 · 1 generations: 103 · 2 generations: 16
- 0 generations: 3454 · 1 generations: 486 · 2 generations: 60
- python3 threegen_selfcheck.py --compare threegen.json
- 54 primes among labels 0…255 · odd primes in C(8,k): 5, 7

## shapes: 280 EN blocks, 280 IT blocks; 4 identical in both languages

- H: ✓ C+e7R+R: ✓ O1+O2: ✓ H+C+e7R+R: ✓ · orthoplex/ladder_check.py
- python3 shapes_selfcheck.py --compare shapes.json
- E8 affine (E9)
- python3 gosset_selfcheck.py --compare gosset.json

## equations: 1407 EN blocks, 1410 IT blocks; 9 identical in both languages

- anti-de Sitter
- Cartan–Dieudonné ≤ n
- algebra Cl(k,k)
- forque_matrix.json
- spring_selfcheck.py
- pgadyn_selfcheck.py
- ganja_fixture.json
- ∇F = J (Maxwell)
- ∇ψJ = mψγ₀ (Dirac)

## map: 137 EN blocks, 137 IT blocks; 1 identical in both languages

- Joan Lasenby, Hamish Todd, Freya Holmer, Stephen Mann

## ask: 47 EN blocks, 47 IT blocks; 0 identical in both languages


## Introductions that do not vary by audience

