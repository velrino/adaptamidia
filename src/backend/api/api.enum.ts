export enum EnumApiCompanyDocumentType {
  CNPJ = "CNPJ",
  CPF = "CPF",
}

export enum EnumApiCompanyType {
  ADVERTISER = "ADVERTISER",
  LOCAL = "LOCAL",
}

export enum EnumApiCompanyUnitType {
  COMMERCIAL_BUILDING = "COMMERCIAL_BUILDING", // Prédio comercial
  RESIDENTIAL_BUILDING = "RESIDENTIAL_BUILDING", // Prédio residencial
  AIRPORT = "AIRPORT", // Aeroporto
  // Food & Beverage
  RESTAURANT = "RESTAURANT", // Restaurante
  BAR = "BAR", // Bar
  CAFE = "CAFE", // Cafeteria
  BAKERY = "BAKERY", // Padaria
  ICE_CREAM_SHOP = "ICE_CREAM_SHOP", // Sorveteria
  PIZZERIA = "PIZZERIA", // Pizzaria
  BUTCHER_SHOP = "BUTCHER_SHOP", // Açougue
  FISH_MARKET = "FISH_MARKET", // Peixaria
  JUICE_BAR = "JUICE_BAR", // Lanchonete/suco
  FAST_FOOD = "FAST_FOOD", // Fast-food

  // Retail
  SUPERMARKET = "SUPERMARKET", // Supermercado
  CONVENIENCE_STORE = "CONVENIENCE_STORE", // Loja de conveniência
  PHARMACY = "PHARMACY", // Farmácia
  BOOKSTORE = "BOOKSTORE", // Livraria
  CLOTHING_STORE = "CLOTHING_STORE", // Loja de roupas
  SHOE_STORE = "SHOE_STORE", // Sapataria
  ELECTRONICS_STORE = "ELECTRONICS_STORE", // Loja de eletrônicos
  HARDWARE_STORE = "HARDWARE_STORE", // Loja de materiais de construção
  FURNITURE_STORE = "FURNITURE_STORE", // Loja de móveis
  TOY_STORE = "TOY_STORE", // Loja de brinquedos

  // Services
  BANK = "BANK", // Banco
  CAR_WASH = "CAR_WASH", // Lava-jato
  LAUNDRY = "LAUNDRY", // Lavanderia
  HAIR_SALON = "HAIR_SALON", // Salão de beleza
  BARBER_SHOP = "BARBER_SHOP", // Barbearia
  GYM = "GYM", // Academia
  SPA = "SPA", // Spa
  PET_SHOP = "PET_SHOP", // Pet shop
  VETERINARY_CLINIC = "VETERINARY_CLINIC", // Clínica veterinária

  // Healthcare
  HOSPITAL = "HOSPITAL", // Hospital
  MEDICAL_CLINIC = "MEDICAL_CLINIC", // Clínica médica
  DENTAL_CLINIC = "DENTAL_CLINIC", // Clínica odontológica
  PSYCHOLOGY_CLINIC = "PSYCHOLOGY_CLINIC", // Clínica psicológica
  LABORATORY = "LABORATORY", // Laboratório de análises

  // Accommodation & Travel
  HOTEL = "HOTEL", // Hotel
  HOSTEL = "HOSTEL", // Hostel
  GAS_STATION = "GAS_STATION", // Posto de gasolina
  BUS_STATION = "BUS_STATION", // Rodoviária
  PARKING_LOT = "PARKING_LOT", // Estacionamento

  // Entertainment
  CINEMA = "CINEMA", // Cinema
  THEATER = "THEATER", // Teatro
  NIGHTCLUB = "NIGHTCLUB", // Boate
  BOWLING_ALLEY = "BOWLING_ALLEY", // Boliche
  GAMING_HOUSE = "GAMING_HOUSE", // Casa de jogos

  // Education & Public
  SCHOOL = "SCHOOL", // Escola
  UNIVERSITY = "UNIVERSITY", // Universidade
  LIBRARY = "LIBRARY", // Biblioteca
  MUSEUM = "MUSEUM", // Museu
  GOVERNMENT_OFFICE = "GOVERNMENT_OFFICE", // Repartição pública

  // Others
  CHURCH = "CHURCH", // Igreja
  FUNERAL_HOME = "FUNERAL_HOME", // Funerária
  PRINT_SHOP = "PRINT_SHOP", // Gráfica
}
