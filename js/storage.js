const DB_KEY='micontrol_pro_v11';
const defaultDB={pin:'1234',theme:'light',currency:'$',accounts:[{id:1,name:'Efectivo',type:'Efectivo',balance:0},{id:2,name:'Banco',type:'Banco',balance:0}],categories:['Comida','Transporte','Servicios','Salud','Compras','Casa','Negocio'],movements:[],budgets:{Comida:100,Transporte:50,Servicios:50},goals:[]};
const Store={load(){try{return {...defaultDB,...JSON.parse(localStorage.getItem(DB_KEY)||'{}')}}catch(e){return structuredClone(defaultDB)}},save(db){localStorage.setItem(DB_KEY,JSON.stringify(db))},reset(){localStorage.removeItem(DB_KEY)}};
