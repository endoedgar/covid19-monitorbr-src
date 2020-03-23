function obterMunicipios() {
  const municipiosJSON = require("./municipios.json");

  let municipios = {};
  municipiosJSON
    .filter(municipio => municipio.codigo_uf == 35)
    .map(municipio => {
      municipios[municipio.nome] = {
        codigo_ibge: municipio.codigo_ibge,
        codigo_uf: municipio.codigo_uf
      };
    });

  return municipios;
}

const municipios = obterMunicipios();

const diaAtual = new Date("March, 21, 2020 12:00:00");
const cidadesBin = `Cidade	Casos confirmados	Óbitos confirmados
Barueri	1	0
Campinas	1	0
Carapicuíba	2	0
Cotia	2	0
Ferraz de Vasconcelos	1	0
Guarulhos	1	0
Hortolândia	1	0
Jaguariúna	1	0
Mauá	1	0
Mogi das Cruzes	1	0
Osasco	1	0
Santana do Parnaíba	2	0
Santo André	3	0
São Bernardo do Campo	4	0
São Caetano do Sul	4	0
São José do Rio Preto 	1	0
São José dos Campos	1	0
São Paulo 	358	9
Taubaté	1	0
Suzano	1	0
Outros Estados/Países	8	0
TOTAL 	396	9
		
Total de Casos confirmados	459	
Total de óbitos	15	
`;

const nSemVirgula = original => original.replace(/[,.]/, "");

const paraNumero = original => parseInt(nSemVirgula(original));

let vet = cidadesBin
  .split("\n")
  .map(line => line.match(/^([^\d]*)([\d|,]*)\s*(\d*).*$/i))
  .filter(line => line[2].length && !isNaN(nSemVirgula(line[2])))
  .map(line => {
    const nome = line[1].trim();
    obj = {
      n: nome,
      c: paraNumero(line[2]),
      o: paraNumero(line[3])
    };

    return obj;
  });

let totais = {};
vet.filter(line => /^TOTAL/i.test(line.n)).forEach(t => (totais[t.n] = t));

let cidades = {};
vet
  .filter(line => !/^TOTAL/i.test(line.n))
  .forEach(c => {
    let ibge;
    if (c.n.match(/Outros/)) ibge = 0;
    else if (typeof municipios[c.n] === "undefined")
      throw new Error(`Nao consegui achar o IBGE de ${c.n}`);
    else ibge = municipios[c.n].codigo_ibge;
    cidades[c.n] = { c: c.c, o: c.o, ibge };
  });

const relatorio = {
  totais,
  cidades
};

const somaTotais = Object.entries(relatorio.cidades)
  .map(c => relatorio.cidades[c[0]])
  .reduce((map, cidade) => {
    return {
      c: (map.c || 0) + cidade.c,
      o: (map.o || 0) + cidade.o
    };
  });

if (somaTotais.c != totais["TOTAL"].c)
  throw new Error(
    `Esperava totais confirmados = ${totais["TOTAL"].c}, recebi ${somaTotais.c}`
  );

if (somaTotais.t != totais["TOTAL"].t)
  throw new Error(
    `Esperava totais obitos = ${totais["TOTAL"].o}, recebi ${somaTotais.o}`
  );

console.log("Preparado para inserir.");
console.log(relatorio);

async function conectarMongo() {
  return new Promise(async (resolve, reject) => {
    try {
      const MongoClient = require("mongodb").MongoClient;

      const uri =
        "mongodb+srv://dbUser:0o8ZmmVfgONBT2YB@cluster0-6huqc.mongodb.net/covid?retryWrites=true&w=majority";
      const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      const con = await client.connect();
      resolve(client.db("covid"));
    } catch (err) {
      reject(err);
    }
  });
}

async function inserirDados(municipios, outrosDados) {
  const moment = require("moment");

  const date = moment(diaAtual).format("YYYY-MM-DD");
  const key = `dates.${date}`;

  const db = await conectarMongo();
  console.log("conectado");
  
  Object.keys(municipios).forEach(nome => {
    const pMunicipio = municipios[nome];

    const municipio = {
      confirmed: pMunicipio.c,
      deaths: pMunicipio.o,
      recovered: null,
      suspect: null
    };

    
    db.collection("timeseries").updateOne(
      {
        ibge: pMunicipio.ibge
      },
      {
        $set: {
          [key]: municipio
        }
      },
      { upsert: 1 }
    );
  });

  db.collection("timeseries").updateOne(
      {
          "misc": 1
      },
      {
          $set: {
              [key]: outrosDados
          }
      },
      { upsert: 1}
  )
}
inserirDados(relatorio.cidades, totais);
