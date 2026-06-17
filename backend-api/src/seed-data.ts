import { coordsForCity } from './common/cities';
import { SEED_OWNER_IDS } from './modules/pets/pets.constants';

/**
 * Conjunto de pets de exemplo inseridos pelo script de seed (`npm run seed`).
 *
 * As fotos usam serviços públicos de imagens reais (placedog.net / loremflickr)
 * com id/lock fixos, para ficarem estáveis entre execuções. O frontend tem
 * fallback (emoji) caso alguma URL não carregue.
 *
 * Os donos são distribuídos entre SEED_OWNER_IDS (round-robin por índice), todos
 * diferentes do dono do usuário, para o motor de recomendação não excluir tudo.
 */

interface SeedPetInput {
  name: string;
  species: string;
  breed?: string;
  gender: 'macho' | 'femea';
  ageMonths: number;
  size: 'pequeno' | 'medio' | 'grande';
  seeking: 'socializacao' | 'cruzamento' | 'ambos';
  bio: string;
  temperament: string[];
  mainPhotoUrl: string;
  city: string;
  recommendationTags?: string[];
  compatibility?: { goodWithDogs?: boolean; goodWithCats?: boolean; goodWithKids?: boolean };
}

/** Monta o documento Pet (sem o dono, atribuído depois em round-robin). */
function build(p: SeedPetInput) {
  return {
    name: p.name,
    species: p.species,
    breed: p.breed,
    gender: p.gender,
    ageMonths: p.ageMonths,
    size: p.size,
    seeking: p.seeking,
    temperament: p.temperament,
    bio: p.bio,
    mainPhotoUrl: p.mainPhotoUrl,
    photos: [p.mainPhotoUrl],
    compatibility: p.compatibility ?? {},
    recommendationTags: p.recommendationTags ?? [],
    city: p.city,
    location: { type: 'Point', coordinates: coordsForCity(p.city) },
    active: true,
    status: 'available',
    metadata: { city: p.city, seed: true },
  };
}

const dog = (id: number) => `https://placedog.net/600/800?id=${id}`;
const cat = (lock: number) => `https://loremflickr.com/600/800/cat?lock=${lock}`;
const parrot = (lock: number) => `https://loremflickr.com/600/800/parrot?lock=${lock}`;
const rabbit = (lock: number) => `https://loremflickr.com/600/800/rabbit?lock=${lock}`;

const SEED_INPUTS: SeedPetInput[] = [
  { name: 'Thor', species: 'Cão', breed: 'SRD', gender: 'macho', ageMonths: 24, size: 'grande', seeking: 'socializacao', city: 'São Paulo', bio: 'Energético, adora correr no parque e biscoito de fígado.', temperament: ['brincalhão', 'leal'], compatibility: { goodWithDogs: true, goodWithKids: true }, recommendationTags: ['vacinado', 'castrado'], mainPhotoUrl: dog(1) },
  { name: 'Mel', species: 'Gato', breed: 'Siamês', gender: 'femea', ageMonths: 12, size: 'pequeno', seeking: 'ambos', city: 'São Paulo', bio: 'Tranquila, dorme no colo e detesta segunda-feira.', temperament: ['dócil', 'caseira'], compatibility: { goodWithCats: true }, recommendationTags: ['vermifugada', 'apartamento'], mainPhotoUrl: cat(1) },
  { name: 'Bóris', species: 'Cão', breed: 'Labrador', gender: 'macho', ageMonths: 48, size: 'grande', seeking: 'cruzamento', city: 'Rio de Janeiro', bio: 'Mestre em buscar a bolinha. Nem sempre devolve.', temperament: ['sociável', 'comilão'], compatibility: { goodWithDogs: true, goodWithKids: true }, recommendationTags: ['pedigree', 'vacinado'], mainPhotoUrl: dog(2) },
  { name: 'Frida', species: 'Gato', breed: 'SRD', gender: 'femea', ageMonths: 6, size: 'pequeno', seeking: 'socializacao', city: 'Rio de Janeiro', bio: 'Filhote curiosa, vai investigar cada canto da casa.', temperament: ['esperta', 'curiosa'], compatibility: { goodWithCats: true, goodWithKids: true }, recommendationTags: ['filhote'], mainPhotoUrl: cat(2) },
  { name: 'Pingo', species: 'Cão', breed: 'Beagle', gender: 'macho', ageMonths: 36, size: 'medio', seeking: 'socializacao', city: 'Belo Horizonte', bio: 'Faro afiado e orelhas enormes. Late pouco, ama comer.', temperament: ['carinhoso', 'farejador'], compatibility: { goodWithDogs: true, goodWithKids: true }, recommendationTags: ['vacinado'], mainPhotoUrl: dog(3) },
  { name: 'Nina', species: 'Gato', breed: 'Persa', gender: 'femea', ageMonths: 24, size: 'pequeno', seeking: 'ambos', city: 'Belo Horizonte', bio: 'Rainha da casa. Aceita servos dispostos a escovar o pelo.', temperament: ['calma', 'elegante'], compatibility: { goodWithCats: true }, recommendationTags: ['pelo longo', 'indoor'], mainPhotoUrl: cat(3) },
  { name: 'Amora', species: 'Cão', breed: 'Poodle', gender: 'femea', ageMonths: 18, size: 'pequeno', seeking: 'socializacao', city: 'Curitiba', bio: 'Fofa e inteligente, aprende truque novo num dia.', temperament: ['inteligente', 'companheira'], compatibility: { goodWithDogs: true, goodWithKids: true }, recommendationTags: ['castrada', 'apartamento'], mainPhotoUrl: dog(4) },
  { name: 'Max', species: 'Cão', breed: 'Pastor Alemão', gender: 'macho', ageMonths: 60, size: 'grande', seeking: 'cruzamento', city: 'Porto Alegre', bio: 'Guardião nato, protetor e muito treinado.', temperament: ['protetor', 'obediente'], compatibility: { goodWithKids: true }, recommendationTags: ['pedigree', 'adestrado'], mainPhotoUrl: dog(5) },
  { name: 'Luna', species: 'Gato', breed: 'Maine Coon', gender: 'femea', ageMonths: 30, size: 'medio', seeking: 'ambos', city: 'Florianópolis', bio: 'Gigante gentil, adora uma janela ensolarada.', temperament: ['gentil', 'tranquila'], compatibility: { goodWithCats: true, goodWithKids: true }, recommendationTags: ['pelo longo'], mainPhotoUrl: cat(4) },
  { name: 'Cacau', species: 'Cão', breed: 'SRD', gender: 'femea', ageMonths: 12, size: 'medio', seeking: 'socializacao', city: 'Salvador', bio: 'Resgatada da rua, retribui em lambeijos e alegria.', temperament: ['grata', 'animada'], compatibility: { goodWithDogs: true, goodWithKids: true }, recommendationTags: ['vacinada', 'castrada'], mainPhotoUrl: dog(6) },
  { name: 'Simba', species: 'Gato', breed: 'SRD laranja', gender: 'macho', ageMonths: 20, size: 'medio', seeking: 'socializacao', city: 'Recife', bio: 'Brincalhão e falante, mia pra contar o dia.', temperament: ['brincalhão', 'falante'], compatibility: { goodWithCats: true, goodWithKids: true }, recommendationTags: ['castrado'], mainPhotoUrl: cat(5) },
  { name: 'Bento', species: 'Cão', breed: 'Golden Retriever', gender: 'macho', ageMonths: 40, size: 'grande', seeking: 'cruzamento', city: 'Brasília', bio: 'O melhor amigo que você poderia pedir. Puro amor.', temperament: ['amoroso', 'paciente'], compatibility: { goodWithDogs: true, goodWithCats: true, goodWithKids: true }, recommendationTags: ['pedigree', 'vacinado'], mainPhotoUrl: dog(7) },
  { name: 'Maya', species: 'Cão', breed: 'Border Collie', gender: 'femea', ageMonths: 28, size: 'medio', seeking: 'socializacao', city: 'Fortaleza', bio: 'Atleta de quatro patas, precisa gastar energia todo dia.', temperament: ['ativa', 'inteligente'], compatibility: { goodWithDogs: true, goodWithKids: true }, recommendationTags: ['adestrada'], mainPhotoUrl: dog(8) },
  { name: 'Mimi', species: 'Gato', breed: 'SRD', gender: 'femea', ageMonths: 8, size: 'pequeno', seeking: 'socializacao', city: 'São Paulo', bio: 'Pequena sombra que segue você pela casa toda.', temperament: ['apegada', 'curiosa'], compatibility: { goodWithCats: true }, recommendationTags: ['filhote'], mainPhotoUrl: cat(6) },
  { name: 'Zeca', species: 'Cão', breed: 'Dachshund', gender: 'macho', ageMonths: 54, size: 'pequeno', seeking: 'ambos', city: 'Rio de Janeiro', bio: 'Salsichinha valente, dono do sofá e do seu coração.', temperament: ['teimoso', 'corajoso'], compatibility: { goodWithKids: true }, recommendationTags: ['castrado'], mainPhotoUrl: dog(9) },
  { name: 'Lola', species: 'Gato', breed: 'Angorá', gender: 'femea', ageMonths: 16, size: 'pequeno', seeking: 'ambos', city: 'Curitiba', bio: 'Vaidosa e mimada, exige carinho na hora certa.', temperament: ['vaidosa', 'carinhosa'], compatibility: { goodWithCats: true }, recommendationTags: ['pelo longo', 'indoor'], mainPhotoUrl: cat(7) },

  // --- Mais diversidade ---
  { name: 'Paulo', species: 'Papagaio', breed: 'Papagaio-verdadeiro', gender: 'macho', ageMonths: 36, size: 'pequeno', seeking: 'socializacao', city: 'São Paulo', bio: 'Repete tudo que ouve e adora uma plateia. Diz "oi" o dia todo.', temperament: ['falante', 'esperto', 'sociável'], compatibility: { goodWithKids: true }, recommendationTags: ['domesticado'], mainPhotoUrl: parrot(1) },
  { name: 'Coco', species: 'Coelho', breed: 'Mini Lop', gender: 'femea', ageMonths: 10, size: 'pequeno', seeking: 'socializacao', city: 'Curitiba', bio: 'Pulinhos felizes e orelhas caídas. Adora cenoura, claro.', temperament: ['fofa', 'quieta'], compatibility: { goodWithKids: true }, recommendationTags: ['indoor'], mainPhotoUrl: rabbit(1) },
  { name: 'Aurora', species: 'Gato', breed: 'Ragdoll', gender: 'femea', ageMonths: 22, size: 'medio', seeking: 'ambos', city: 'Florianópolis', bio: 'Derrete no colo como uma boneca de pano.', temperament: ['dócil', 'preguiçosa'], compatibility: { goodWithCats: true, goodWithKids: true }, recommendationTags: ['pelo longo'], mainPhotoUrl: cat(8) },
  { name: 'Duque', species: 'Cão', breed: 'Rottweiler', gender: 'macho', ageMonths: 30, size: 'grande', seeking: 'cruzamento', city: 'Porto Alegre', bio: 'Imponente, mas um filhote grande por dentro.', temperament: ['protetor', 'forte'], compatibility: { goodWithKids: true }, recommendationTags: ['pedigree', 'adestrado'], mainPhotoUrl: dog(10) },
  { name: 'Pipoca', species: 'Cão', breed: 'Shih Tzu', gender: 'femea', ageMonths: 14, size: 'pequeno', seeking: 'socializacao', city: 'Recife', bio: 'Pequena, fofa e cheia de personalidade.', temperament: ['fofa', 'companheira'], compatibility: { goodWithDogs: true, goodWithKids: true }, recommendationTags: ['apartamento'], mainPhotoUrl: dog(11) },
  { name: 'Tom', species: 'Gato', breed: 'SRD', gender: 'macho', ageMonths: 48, size: 'medio', seeking: 'ambos', city: 'Salvador', bio: 'Independente e bom caçador de bolinhas de papel.', temperament: ['independente', 'caçador'], compatibility: { goodWithCats: true }, recommendationTags: ['castrado'], mainPhotoUrl: cat(9) },
  { name: 'Bidu', species: 'Cão', breed: 'Vira-lata caramelo', gender: 'macho', ageMonths: 26, size: 'medio', seeking: 'socializacao', city: 'Belo Horizonte', bio: 'O lendário caramelo brasileiro: leal e brincalhão.', temperament: ['leal', 'brincalhão'], compatibility: { goodWithDogs: true, goodWithCats: true, goodWithKids: true }, recommendationTags: ['vacinado', 'castrado'], mainPhotoUrl: dog(12) },
  { name: 'Estrela', species: 'Cão', breed: 'Spitz Alemão', gender: 'femea', ageMonths: 20, size: 'pequeno', seeking: 'ambos', city: 'Brasília', bio: 'Pequena nuvem fofa que late pra anunciar visitas.', temperament: ['alerta', 'animada'], compatibility: { goodWithKids: true }, recommendationTags: ['apartamento'], mainPhotoUrl: dog(13) },
  { name: 'Romeu', species: 'Coelho', breed: 'Angorá', gender: 'macho', ageMonths: 16, size: 'pequeno', seeking: 'ambos', city: 'Fortaleza', bio: 'Bolinha de pelo macio, curioso com tudo.', temperament: ['curioso', 'macio'], compatibility: { goodWithKids: true }, recommendationTags: ['indoor'], mainPhotoUrl: rabbit(2) },
  { name: 'Jade', species: 'Gato', breed: 'Bengal', gender: 'femea', ageMonths: 18, size: 'medio', seeking: 'socializacao', city: 'Rio de Janeiro', bio: 'Ágil e selvagem na aparência, dengosa de verdade.', temperament: ['ágil', 'brincalhona'], compatibility: { goodWithCats: true, goodWithKids: true }, recommendationTags: ['castrada'], mainPhotoUrl: cat(10) },
];

// Atribui um dono a cada pet em round-robin (todos != dono do usuário).
export const SEED_PETS = SEED_INPUTS.map((p, i) => ({
  ...build(p),
  ownerId: SEED_OWNER_IDS[i % SEED_OWNER_IDS.length],
}));
