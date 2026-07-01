--
-- PostgreSQL database dump
--

\restrict FTlQ2WmScZydAtQv7LUI77DcBCOpNBrvYbbQ5KwLCudxR9uUcg1tFOjoaBOG5yW

-- Dumped from database version 18.3 (Ubuntu 18.3-1.pgdg22.04+1)
-- Dumped by pg_dump version 18.3 (Ubuntu 18.3-1.pgdg22.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: archived_order_items; Type: TABLE; Schema: public; Owner: infrashop
--

CREATE TABLE public.archived_order_items (
    id integer NOT NULL,
    archived_order_id integer,
    original_order_item_id integer,
    item_id integer,
    item_name text NOT NULL,
    sku text,
    quantity integer NOT NULL,
    created_at timestamp without time zone
);


ALTER TABLE public.archived_order_items OWNER TO infrashop;

--
-- Name: archived_order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: infrashop
--

CREATE SEQUENCE public.archived_order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.archived_order_items_id_seq OWNER TO infrashop;

--
-- Name: archived_order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: infrashop
--

ALTER SEQUENCE public.archived_order_items_id_seq OWNED BY public.archived_order_items.id;


--
-- Name: archived_orders; Type: TABLE; Schema: public; Owner: infrashop
--

CREATE TABLE public.archived_orders (
    id integer NOT NULL,
    original_order_id integer,
    customer_name text NOT NULL,
    organization text,
    delivery_point text NOT NULL,
    delivery_start timestamp without time zone NOT NULL,
    return_at timestamp without time zone NOT NULL,
    status text NOT NULL,
    pdf_path text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    archived_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.archived_orders OWNER TO infrashop;

--
-- Name: archived_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: infrashop
--

CREATE SEQUENCE public.archived_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.archived_orders_id_seq OWNER TO infrashop;

--
-- Name: archived_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: infrashop
--

ALTER SEQUENCE public.archived_orders_id_seq OWNED BY public.archived_orders.id;


--
-- Name: items; Type: TABLE; Schema: public; Owner: infrashop
--

CREATE TABLE public.items (
    id integer NOT NULL,
    sku text,
    name text NOT NULL,
    short_description text,
    long_description text,
    image_url text,
    thumbnail_url text,
    total_stock integer DEFAULT 0,
    available_stock integer DEFAULT 0,
    category text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    auto_add_item_id integer,
    auto_add_item_quantity integer DEFAULT 1 NOT NULL,
    varasto text,
    rama_id text
);


ALTER TABLE public.items OWNER TO infrashop;

--
-- Name: items_id_seq; Type: SEQUENCE; Schema: public; Owner: infrashop
--

CREATE SEQUENCE public.items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.items_id_seq OWNER TO infrashop;

--
-- Name: items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: infrashop
--

ALTER SEQUENCE public.items_id_seq OWNED BY public.items.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: infrashop
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer,
    item_id integer NOT NULL,
    item_name text NOT NULL,
    sku text,
    quantity integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    group_id integer,
    group_parent_id integer
);


ALTER TABLE public.order_items OWNER TO infrashop;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: infrashop
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_id_seq OWNER TO infrashop;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: infrashop
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: infrashop
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    customer_name text NOT NULL,
    organization text,
    delivery_point text NOT NULL,
    delivery_start timestamp without time zone NOT NULL,
    return_at timestamp without time zone NOT NULL,
    status text DEFAULT 'placed'::text NOT NULL,
    pdf_path text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    event_id integer,
    special_requirements jsonb,
    open_comment text
);


ALTER TABLE public.orders OWNER TO infrashop;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: infrashop
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO infrashop;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: infrashop
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: stock_audit; Type: TABLE; Schema: public; Owner: infrashop
--

CREATE TABLE public.stock_audit (
    id integer NOT NULL,
    item_id integer,
    order_id integer,
    delta integer,
    reason text,
    actor text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_audit OWNER TO infrashop;

--
-- Name: stock_audit_id_seq; Type: SEQUENCE; Schema: public; Owner: infrashop
--

CREATE SEQUENCE public.stock_audit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_audit_id_seq OWNER TO infrashop;

--
-- Name: stock_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: infrashop
--

ALTER SEQUENCE public.stock_audit_id_seq OWNED BY public.stock_audit.id;


--
-- Name: archived_order_items id; Type: DEFAULT; Schema: public; Owner: infrashop
--

ALTER TABLE ONLY public.archived_order_items ALTER COLUMN id SET DEFAULT nextval('public.archived_order_items_id_seq'::regclass);


--
-- Name: archived_orders id; Type: DEFAULT; Schema: public; Owner: infrashop
--

ALTER TABLE ONLY public.archived_orders ALTER COLUMN id SET DEFAULT nextval('public.archived_orders_id_seq'::regclass);


--
-- Name: items id; Type: DEFAULT; Schema: public; Owner: infrashop
--

ALTER TABLE ONLY public.items ALTER COLUMN id SET DEFAULT nextval('public.items_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: infrashop
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: infrashop
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: stock_audit id; Type: DEFAULT; Schema: public; Owner: infrashop
--

ALTER TABLE ONLY public.stock_audit ALTER COLUMN id SET DEFAULT nextval('public.stock_audit_id_seq'::regclass);


--
-- Data for Name: archived_order_items; Type: TABLE DATA; Schema: public; Owner: infrashop
--

COPY public.archived_order_items (id, archived_order_id, original_order_item_id, item_id, item_name, sku, quantity, created_at) FROM stdin;
\.


--
-- Data for Name: archived_orders; Type: TABLE DATA; Schema: public; Owner: infrashop
--

COPY public.archived_orders (id, original_order_id, customer_name, organization, delivery_point, delivery_start, return_at, status, pdf_path, created_at, updated_at, archived_at) FROM stdin;
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: infrashop
--

COPY public.items (id, sku, name, short_description, long_description, image_url, thumbnail_url, total_stock, available_stock, category, created_at, updated_at, auto_add_item_id, auto_add_item_quantity, varasto, rama_id) FROM stdin;
14	8	RGB lediputki 201cm pyöreä	\N	\N	\N	\N	188	188	valot	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
19	13	Toimisto näppäimistö	\N	\N	\N	\N	47	47	oheislaitteet	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
26	20	RGB wash pixel ohjattu	\N	\N	\N	\N	30	30	valot	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
29	23	RGB lediputki 201cm litteä	\N	\N	\N	\N	26	26	valot	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
33	27	Trussit 3m trussi	\N	\N	\N	\N	24	24	trussit	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
36	30	2D kulma L	\N	\N	\N	\N	23	23	trussit	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
43	37	Vaneripöydät D	267cm*60cm	\N	\N	\N	16	16	pöydät	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
45	39	Trussit 2m trussi	\N	\N	\N	\N	16	16	trussit	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
49	43	Trussit 4m trussi	\N	\N	\N	\N	12	12	trussit	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
53	47	Standipaketti 6x8m	\N	\N	\N	\N	10	10	standipaketit	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
54	48	Loossi	\N	\N	\N	\N	10	10	standipaketit	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
58	52	Päätylaatta (alutruss)	\N	\N	\N	\N	8	8	trussit	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
59	53	Trussit 1m trussi	\N	\N	\N	\N	8	8	trussit	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
62	56	Trussit 2,5m trussi	\N	\N	\N	\N	7	7	trussit	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
65	59	Pelikone	\N	\N	\N	\N	5	5	koneet	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
66	60	Induktioliesi	\N	\N	\N	\N	5	5	kodinkoneet	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
67	61	Päätylaatta 60x60cm rauta (musta) (globaltrus)	\N	\N	\N	\N	4	4	trussit	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
68	62	Päätylaatta 60x60cm alumiini (bt-truss)	\N	\N	\N	\N	4	4	trussit	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
69	63	Trussit 0,5m trussi	\N	\N	\N	\N	4	4	trussit	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
70	64	Trussit 4,5m trussi	\N	\N	\N	\N	4	4	trussit	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
71	65	4D risteys	\N	\N	\N	\N	4	4	trussit	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
72	66	Standi paketti Custom	\N	\N	\N	\N	3	3	standipaketit	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
73	67	Päätylaatta (milos)	\N	\N	\N	\N	3	3	trussit	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
74	68	t-pala	\N	\N	\N	\N	3	3	trussit	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
75	69	Taittojalka	\N	\N	\N	\N	2	2	muut	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
76	70	Päätylaatta (eurotruss)	\N	\N	\N	\N	2	2	trussit	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
77	71	Päätylaatta (globaltruss/omavalmiste)	\N	\N	\N	\N	2	2	trussit	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
78	72	Trussit 3,5m trussi	\N	\N	\N	\N	2	2	trussit	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
56	50	Standipaketti 4x4m	\N	\N	\N	\N	9	5	standipaketit	2026-03-30 21:24:30.576123	2026-05-24 21:42:29.188256	\N	1	\N	\N
7	1	Ständialueen matotus per neliömetri	\N	\N	\N	\N	9936	9863	standipaketit	2026-03-30 21:24:30.576123	2026-05-24 21:32:00.77224	\N	1	\N	\N
8	2	10G LR -verkko	10 Gbps -valokuitu, LR, LC-liitin: Valokuitu, singlemode.	10 Gbps -valokuitu, LR, LC-liitin: Valokuitu, singlemode. Vaatii erillisen valokuitusovittimen tietokoneesta tai muusta laitteesta. Verkko toimittaa valokuidun pään tilatulle paikalle.	1775338695846_wxn5h_10G_LR_Ethernet_logo_design.png	1775338695846_wxn5h_10G_LR_Ethernet_logo_design_thumb.png	0	999	verkko	2026-03-30 21:24:30.576123	2026-04-06 17:50:35.828377	\N	1	\N	\N
27	21	Pelinäyttö	\N	\N	\N	\N	29	7	koneet	2026-03-30 21:24:30.576123	2026-05-24 21:01:34.941183	\N	1	\N	\N
28	22	Ikeapöydät	vain hätätapauksessa	\N	\N	\N	28	27	pöydät	2026-03-30 21:24:30.576123	2026-05-14 16:28:45.825814	\N	1	\N	\N
20	14	360 led-kaksipäinen-100		\N	\N	\N	0	43	valot	2026-03-30 21:24:30.576123	2026-04-06 18:19:22.857646	\N	1	\N	\N
11	5	Verkkokaapeli	\N	\N	\N	\N	952	840	verkko	2026-03-30 21:24:30.576123	2026-05-24 21:42:29.188256	\N	1	\N	\N
31	25	PROVO Matto - Hiirimatto	\N	\N	\N	\N	25	12	oheislaitteet	2026-03-30 21:24:30.576123	2026-05-24 21:01:34.941183	\N	1	\N	\N
30	24	360 led-kaksipäinen-250		\N	\N	\N	0	26	valot	2026-03-30 21:24:30.576123	2026-04-06 18:19:44.818876	\N	1	\N	\N
16	10	TV virtakaapeli ja hdmi kaapeli	\N	\N	\N	\N	71	34	tv	2026-03-30 21:24:30.576123	2026-05-28 17:36:26.096835	\N	1	\N	\N
18	12	Toimistohiiri	\N	\N	\N	\N	48	42	oheislaitteet	2026-03-30 21:24:30.576123	2026-05-23 12:38:39.182098	\N	1	\N	\N
23	17	360 led-kaksipäinen-50		\N	\N	\N	0	39	valot	2026-03-30 21:24:30.576123	2026-04-06 18:19:50.158061	\N	1	\N	\N
22	16	360 led-yksipäinen-100		\N	\N	\N	0	40	valot	2026-03-30 21:24:30.576123	2026-04-06 18:19:54.914862	\N	1	\N	\N
35	29	360 led-yksipäinen-150		\N	\N	\N	0	23	valot	2026-03-30 21:24:30.576123	2026-04-06 18:20:00.689848	\N	1	\N	\N
9	3	Valaistus	\N	\N	\N	\N	992	962	valot	2026-03-30 21:24:30.576123	2026-05-29 07:41:03.086556	\N	1	\N	\N
24	18	Yleisnäyttö	\N	\N	\N	\N	37	37	koneet	2026-03-30 21:24:30.576123	2026-05-18 06:04:11.547001	\N	1	\N	\N
55	49	Vaneripöydät G	248cm*75cm	\N	\N	\N	121	1	pöydät	2026-03-30 21:24:30.576123	2026-05-28 17:36:26.096835	\N	1	\N	\N
15	9	Valkoiset muovipöydät	180cm*74cm muovipöytä	\N	\N	\N	152	102	pöydät	2026-03-30 21:24:30.576123	2026-06-03 07:47:13.177529	\N	1	\N	\N
34	28	Vaneripöydät C	257cm*60cm	\N	\N	\N	60	4	pöydät	2026-03-30 21:24:30.576123	2026-06-03 07:47:13.177529	\N	1	\N	\N
21	15	Toimistotuolit		\N	1775056214831_IMG20250604142221.jpg	1775056215913_IMG20250604142221_thumb.jpg	43	0	tuolit	2026-03-30 21:24:30.576123	2026-06-03 12:30:48.068484	\N	1	\N	\N
32	26	PROVO KUMU PRO - 7.1 tilaäänipelikuuloke	\N	\N	\N	\N	24	16	oheislaitteet	2026-03-30 21:24:30.576123	2026-05-24 21:01:34.941183	\N	1	\N	\N
37	31	PROVO NOSTE PRO - hiiri	\N	\N	\N	\N	20	12	oheislaitteet	2026-03-30 21:24:30.576123	2026-05-24 21:01:34.941183	\N	1	\N	\N
38	32	PROVO KAJO OPTO - Näppäimistö	\N	\N	\N	\N	20	12	oheislaitteet	2026-03-30 21:24:30.576123	2026-05-24 21:01:34.941183	\N	1	\N	\N
39	33	Tehokone	\N	\N	\N	\N	19	4	koneet	2026-03-30 21:24:30.576123	2026-05-24 21:01:34.941183	\N	1	\N	\N
13	7	Tuoli	Sininen Oulun-Hallin muovituoli	Oulunhallin omat siniset muovituolit	1776437380904_ox837_1000019674.jpg	1776437380904_ox837_1000019674_thumb.jpg	1000	264	tuolit	2026-03-30 21:24:30.576123	2026-05-28 17:36:26.096835	\N	1	\N	\N
57	51	Standipaketti 6x4m	\N	\N	\N	\N	8	7	standipaketit	2026-03-30 21:24:30.576123	2026-05-18 05:51:21.811086	\N	1	\N	\N
79	73	Trussit 5m trussi	\N	\N	\N	\N	2	2	trussit	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
82	76	3D kulma	\N	\N	\N	\N	1	1	trussit	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
88	82	Pullonkeräys tynnyrit	\N	\N	\N	\N	0	0	muut	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
89	83	Jenkkikaappi	\N	\N	\N	\N	0	0	kodinkoneet	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
97	91	trussi paketti	\N	\N	\N	\N	0	0	trussit	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
98	92	Trussit 1,5m trussi	\N	\N	\N	\N	0	0	trussit	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
99	93	Isompi valkokangas 	220x124cm kokoinen		\N	\N	2	0	muut	2026-03-30 21:24:30.576123	2026-05-24 10:34:03.706307	\N	1	\N	\N
90	84	Jääkaappipakastin			1775337867738_hnu4z_jaakaappi3.jpg	1775337867738_hnu4z_jaakaappi3_thumb.jpg	2	0	kodinkoneet	2026-03-30 21:24:30.576123	2026-05-24 10:59:03.078735	\N	1	\N	\N
100	94	Vaneripöydät Gk	248cm*75cm	 Etureunassa reikä kaiteelle	\N	\N	24	1	pöydät	2026-03-30 21:24:30.576123	2026-05-11 07:04:04.138911	\N	1	\N	\N
25	19	Vaneripöydät E	272cm*60cm	\N	\N	\N	90	2	pöydät	2026-03-30 21:24:30.576123	2026-05-24 21:21:49.697128	\N	1	\N	\N
17	11	info-tv	42" - 55", kun tilaat niin kerro mihin tulee		\N	\N	0	34	tv	2026-03-30 21:24:30.576123	2026-06-06 01:00:06.878179	\N	1	Honkahallit 1	\N
91	85	Juomalaari	Vectorama tarroilla		1775339677109_h309c_pullo.jpg	1775339677109_h309c_pullo_thumb.jpg	1	0	kodinkoneet	2026-03-30 21:24:30.576123	2026-05-24 10:37:40.359812	\N	1	\N	\N
51	45	Esperanza EG102 - peliohjain	\N	\N	\N	\N	10	9	oheislaitteet	2026-03-30 21:24:30.576123	2026-04-02 19:33:17.536709	\N	1	\N	\N
105	pieni-j-kaappi	Pieni jääkaappi	Pieni jääkaappi	\N	1775340160488_1ltyt_20250526_155217.jpg	1775340160488_1ltyt_20250526_155217_thumb.jpg	1	0	kodinkoneet	2026-04-04 22:00:38.26894	2026-05-24 21:58:22.805566	\N	1	\N	\N
41	35	Medialäppäri	\N	\N	\N	\N	18	2	koneet	2026-03-30 21:24:30.576123	2026-05-24 18:55:46.518558	\N	1	\N	\N
106	valkoinen-tuoli	Valkoinen tuoli	Isot valkoist muovi tuolit.	\N	1775340198248_do0de_20240529_181037.jpg	1775340198248_do0de_20240529_181037_thumb.jpg	10	10	tuolit	2026-04-04 22:01:39.595475	2026-04-04 22:03:18.802451	\N	1	\N	\N
81	75	Kiertoilmauuni	\N	\N	\N	\N	1	0	kodinkoneet	2026-03-30 21:24:30.576123	2026-03-30 21:24:30.576123	\N	1	\N	\N
52	46	Sähköt 1x16A 230V 3000W	8 konepaikkaa.	Sama kuin edellä (käytännössä edellinen on sama kuin tämä) mutta tähän ehkä vähän enemmän valaistusta, tai max 6-8 pöytäkonetta mutta ei muuta. tai esimerkiksi YKSI kahvinkeitin ja pieni jääkaappi.	1775338993750_wuctz_1x16A.jpg	1775338993750_wuctz_1x16A_thumb.jpg	0	8	sähköt	2026-03-30 21:24:30.576123	2026-05-28 17:36:26.096835	\N	1	\N	\N
85	79	Säkkituoli	Musta säkkituoli		\N	\N	4	0	tuolit	2026-03-30 21:24:30.576123	2026-05-29 07:40:20.203786	\N	1	\N	\N
96	90	360 led-yksipäinen-250		\N	\N	\N	0	0	valot	2026-03-30 21:24:30.576123	2026-04-06 18:20:05.637167	\N	1	\N	\N
83	77	Vaneripöydät F-info	193cm*60cm	Vain infon käytössä olevat pöydät. Etureunassa kaiteelle reiät	\N	\N	10	0	pöydät	2026-03-30 21:24:30.576123	2026-05-11 07:01:59.713004	\N	1	\N	\N
10	4	10G SR -verkko	10 Gbps -valokuitu, SR, LC-liitin: Valokuitu, multimode.	10 Gbps -valokuitu, SR, LC-liitin: Valokuitu, multimode. Vaatii erillisen valokuitusovittimen tietokoneesta tai muusta laitteesta. Verkko toimittaa valokuidun pään tilatulle paikalle.	1775338706245_e73bz_Futuristic_10G_SR_logo_design.png	1775338706245_e73bz_Futuristic_10G_SR_logo_design_thumb.png	0	970	verkko	2026-03-30 21:24:30.576123	2026-04-06 17:50:28.897975	\N	1	\N	\N
95	89	360 led-kaksipäinen-150		\N	\N	\N	0	0	valot	2026-03-30 21:24:30.576123	2026-04-06 18:19:33.2667	\N	1	\N	\N
94	88	360 led-yksipäinen-50		\N	\N	\N	0	0	valot	2026-03-30 21:24:30.576123	2026-04-06 18:20:09.799078	\N	1	\N	\N
48	42	Sähköt 3x16A 400V 9000W	24 konepaikkaa.	24 konepaikkaa. Tähän voi sitten kytkeä jo enempi koneita, tehokkaampia valokannuja, kevyttä keittiövarustusta tai 3D tulostimia yms	1775339006409_nfxq6_3x16A.jpg	1775339006409_nfxq6_3x16A_thumb.jpg	0	9	sähköt	2026-03-30 21:24:30.576123	2026-05-28 17:32:45.70741	\N	1	\N	\N
102	valkoinen-j-kaappi	Valkoinen jääkaappi	Valkoinen jääkaappi	\N	1775337852636_9usqz_jaakaappi2.jpg	1775337852636_9usqz_jaakaappi2_thumb.jpg	3	0	kodinkoneet	2026-04-04 21:23:56.714406	2026-04-09 10:59:34.26959	\N	1	\N	\N
107	iso-kaapelisuoja	Iso kaapelisuoja	Isompi kaksikanavainen kaapelisuoja		\N	\N	15	14	sähköt	2026-04-26 09:55:08.498714	2026-05-29 06:57:41.372118	\N	1	\N	\N
108	pienempi-kaapelisuoja	Pienempi kaapelisuoja	Pienempi kaksikanavainen kaapelisuoja 		\N	\N	10	10	sähköt	2026-04-26 09:55:37.912721	2026-05-29 06:57:50.266529	\N	1	\N	\N
93	87	Mikro			1775337756588_v5hf3_mikro1.jpg	1775337756588_v5hf3_mikro1_thumb.jpg	5	1	kodinkoneet	2026-03-30 21:24:30.576123	2026-05-11 11:33:17.413367	\N	1	\N	\N
80	74	Arkkupakastin			arkkupakastin.jpg	1774906674123_no-image_thumb.png	1	0	kodinkoneet	2026-03-30 21:24:30.576123	2026-05-24 10:59:03.078735	\N	1	\N	\N
92	86	Metallinen jääkaappi			1775337784895_9gzw3_jaakaappi1.jpg	1775337784895_9gzw3_jaakaappi1_thumb.jpg	1	0	kodinkoneet	2026-03-30 21:24:30.576123	2026-05-11 11:33:17.413367	\N	1	\N	\N
12	6	1G Base-T -verkko	 1 Gbps -verkkoportti ”RJ45”: Normaali Ethernet eli laniportti ja verkkokaapeli	 1 Gbps -verkkoportti ”RJ45”: Normaali Ethernet eli laniportti. Tilaa yksi kpl per tietokone. Verkko tuo lähistölle kytkimen riittävän monella portilla. Tilaa lisäksi tarvittava määrä verkkokaapeleita ja lisätietoihin arvio pituuksista.	1775338710685_0vdz6_Sleek_1G_logo_with_glowing_blue_ring.png	1775338710685_0vdz6_Sleek_1G_logo_with_glowing_blue_ring_thumb.png	0	638	verkko	2026-03-30 21:24:30.576123	2026-05-28 17:36:26.096835	11	1	\N	\N
104	vesiastia	Vesiastia	Muoviset vesiastiat	\N	1775889351787_v4153_1000019491.jpg	1775889351787_v4153_1000019491_thumb.jpg	5	3	kodinkoneet	2026-04-04 21:30:35.554547	2026-05-11 11:33:17.413367	\N	1	\N	\N
101	mellakka-aita	Mellakka-aita	Vectoraman mellakka-aidata	\N	1775889364220_n87is_1000019490.jpg	1775889364220_n87is_1000019490_thumb.jpg	22	5	muut	2026-04-01 15:58:10.635234	2026-05-24 21:01:34.941183	\N	1	\N	\N
84	78	Sohva			\N	\N	5	0	tuolit	2026-03-30 21:24:30.576123	2026-05-24 21:58:22.805566	\N	1	\N	\N
86	80	Lasiovinen jääkaappi	Vectorama teippaukset	Kioskiin menevä jääkaappi	\N	\N	1	0	kodinkoneet	2026-03-30 21:24:30.576123	2026-05-18 06:04:11.547001	\N	1	\N	\N
87	81	Lasi-ikkunallinen arkkupakastin	Pingviini		1775337999547_yrvjy_pingviini.jpg	1775337999547_yrvjy_pingviini_thumb.jpg	1	0	kodinkoneet	2026-03-30 21:24:30.576123	2026-05-18 06:04:11.547001	\N	1	\N	\N
50	44	Vaneripöydät B	250cm*60cm	\N	\N	\N	57	6	pöydät	2026-03-30 21:24:30.576123	2026-06-06 11:27:44.84958	\N	1	\N	\N
47	41	TV Trussi-kiinnitys	\N	\N	\N	\N	12	7	tv	2026-03-30 21:24:30.576123	2026-05-24 21:01:34.941183	\N	1	\N	\N
110	jatkojohto-5m-3-plugia	Jatkojohto 5m 3-plugia	5m jatkojohto 3 pistokkeella		\N	\N	200	188	sähköt	2026-05-14 18:44:02.996238	2026-05-29 07:40:20.203786	\N	1	\N	\N
109	jatkojohto-1-5m-3-plugia	Jatkojohto 1.5m 3-plugia	1,5m jatkojohto kolmella pistokkeella	\N	\N	\N	50	27	sähköt	2026-05-14 18:43:32.29053	2026-05-29 07:41:03.086556	\N	1	\N	\N
119	kahvinkeitin	Kahvinkeitin	Kahvinkeitin	\N	\N	\N	1	1	kodinkoneet	2026-05-24 10:38:39.880362	2026-05-24 10:38:39.880362	\N	1	\N	\N
120	led-tussitaulu	Led tussitaulu	Led tussitaulu	\N	\N	\N	1	1	muut	2026-05-24 10:40:01.837784	2026-05-24 10:40:01.837784	\N	1	\N	\N
63	57	Vaneripöydät H	193cm*75cm		\N	\N	16	2	pöydät	2026-03-30 21:24:30.576123	2026-05-25 13:21:14.900833	\N	1	\N	\N
115	jatkojohto-1-5m-6-plugia	Jatkojohto 1.5m 6-plugia	1,5m jatkojohto kuudella pistokkeella	\N	\N	\N	50	38	sähköt	2026-05-14 19:11:05.60011	2026-05-24 21:01:34.941183	\N	1	\N	\N
111	jatkokohto-5m-5-plugilla	Jatkokohto 5m 6-plugilla	5m jatkojohto kuudella pistokkeella		\N	\N	30	30	sähköt	2026-05-14 18:44:31.797227	2026-05-14 19:12:34.321103	\N	1	\N	\N
117	jatkojohto-5m-6-plugia	Jatkojohto 5m 6-plugia	5m jatkojohto kuudella pistokkeella	\N	\N	\N	15	7	sähköt	2026-05-14 19:13:59.661424	2026-05-24 21:10:22.674712	\N	1	\N	\N
122	patja	Patja	Vaahtomuovipatja	\N	\N	\N	10	8	muut	2026-05-29 07:38:41.629757	2026-05-29 07:41:03.086556	\N	1	\N	\N
61	55	Spottivalot	Värilliset ja valkoinen	\N	\N	\N	0	0	valot	2026-03-30 21:24:30.576123	2026-05-18 05:51:21.811086	\N	1	\N	\N
116	jatkojohto-5m-4-plugia	Jatkojohto 5m 4-plugia	5m jatkojohto neljällä pistokkeella	\N	\N	\N	30	29	sähköt	2026-05-14 19:13:23.341834	2026-05-28 07:00:04.328348	\N	1	\N	\N
64	58	Sähköt 230V	Tähän voi kytkeä esimerkiksi pöytävalaisimia, koristevaloja, muutamia läppäreitä tai puhelimen latauspistettä yms, ei mitään isompaa.		1775339001834_njika_230V.jpg	1775339001834_njika_230V_thumb.jpg	0	10	sähköt	2026-03-30 21:24:30.576123	2026-05-28 17:34:27.981032	\N	1	\N	\N
113	iffalcon-55-u65-4k-led-tv	iFFALCON 55" U65 4K LED TV	Panel Type: VA Color Gamut: 72% NTSC Resolution: 4K HDR Panel Resolution: 3840*2160 BlueTooth: BT5.2 Wi-Fi: WiFi 5 HDMI Version: HDMI1.4 & HDMI2.0&HDMI2.1, HDCP1.4 & HDCP2.2 VESA Wall-mounting (mm): 200*200 Set Size with Stand (WxHxD): 1226*255*750 Package Dimensions (LxWxH): 1360*128*830(without pallet) Net Weight Without Stand（Kg）: 9	\N	\N	\N	20	12	tv	2026-05-14 19:02:14.260343	2026-05-26 18:18:10.108213	\N	1	\N	\N
60	54	Sähköt Muu	Erikoistilaus	Kuvaa tarkasti mitä vaatimuksia.	\N	\N	0	0	sähköt	2026-03-30 21:24:30.576123	2026-05-24 21:58:22.805566	\N	1	\N	\N
118	pienempi-valkokangas	Pienempi valkokangas	180x124cm kokoinen	\N	\N	\N	4	3	muut	2026-05-24 10:34:33.233667	2026-05-24 18:28:20.844841	\N	1	\N	\N
114	cisco-tandberg-ttc8-02-robotti	Cisco/Tandberg TTC8-02 robotti kamera	Cisco TelePresence PrecisionHD Camera 1080p  Tandberg PrecisionHD 1080p  Speksejä PTZ, RS232 omalla kaapelilla RJ45-liittimeen tai kaukosäätimellä. 12X zoom 3G-SDI (720p60 / 1080p30) HDMI 1080p60 Käyttöjännite 12V 2A	\N	\N	\N	4	3	oheislaitteet	2026-05-14 19:03:25.345902	2026-05-14 19:03:25.345902	\N	1	\N	\N
40	34	Sähköt 3x32A 400V 15000W	48 konepaikkaa.	48 konepaikkaa. Tää alkaa olemaan jo aika paljon mutta tähän voi kytkeä jo oikeesti vähän enempi kamaa. Yliopiston standi on ollut muistaakseni ainoa jolle on tarvinut jotain näin tymäkkää tuoda kun siellä oli kaapillinen 3D tulostimia ja laserleikkuria yms Tämä on myös se määrä tai yksikkö jonka esimerkiksi livelava ja sen tekniikka syö sähköä eli saanee vähän osviittaa että tuo on aika paljon sähköä.	1775339010854_w6szm_3x32A.jpg	1775339010854_w6szm_3x32A_thumb.jpg	0	13	sähköt	2026-03-30 21:24:30.576123	2026-05-24 21:35:17.788484	\N	1	\N	\N
42	36	Tv lattiajalat	\N	\N	\N	\N	17	0	tv	2026-03-30 21:24:30.576123	2026-05-26 18:18:10.108213	\N	1	\N	\N
44	38	Tv pöytäjalat	\N	\N	\N	\N	16	4	tv	2026-03-30 21:24:30.576123	2026-05-28 17:36:26.096835	\N	1	\N	\N
121	sohvap-yt	Sohvapöytä	Musta sohvapöytä	\N	\N	\N	1	0	pöydät	2026-05-25 07:39:07.863036	2026-05-25 07:39:07.863036	\N	1	\N	\N
112	ikea-tv-rhand-p-yt-lamppu	Ikea tvärhand pöytälamppu	 Ikea tvärhand pöytälamppu 3d printatulla varjostimella	\N	\N	\N	40	20	valot	2026-05-14 18:47:27.606461	2026-05-24 10:13:59.548236	\N	1	\N	\N
46	40	Kuluttaja-tv	42" - 55", kun tilaat niin kerro mihin tulee 		\N	\N	0	2	tv	2026-03-30 21:24:30.576123	2026-06-06 00:59:51.896002	\N	1	Honkahallit 1	RAMA-46
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: infrashop
--

COPY public.order_items (id, order_id, item_id, item_name, sku, quantity, created_at, group_id, group_parent_id) FROM stdin;
624	12	12	1G Base-T -verkko	6	23	2026-05-27 17:00:12.08263	\N	\N
625	12	34	Vaneripöydät C	28	2	2026-05-27 17:00:12.08263	\N	\N
626	12	48	Sähköt 3x16A 400V 9000W	42	1	2026-05-27 17:00:12.08263	\N	\N
627	12	55	Vaneripöydät G	49	6	2026-05-27 17:00:12.08263	\N	\N
5	3	63	Vaneripöydät H	57	1	2026-04-02 16:03:44.38103	\N	\N
628	12	63	Vaneripöydät H	57	5	2026-05-27 17:00:12.08263	\N	\N
765	43	13	Tuoli	7	10	2026-05-29 21:31:47.051021	\N	\N
450	46	11	Verkkokaapeli	5	2	2026-05-24 21:21:49.697128	\N	\N
451	46	12	1G Base-T -verkko	6	1	2026-05-24 21:21:49.697128	\N	\N
452	46	13	Tuoli	7	20	2026-05-24 21:21:49.697128	\N	\N
453	46	15	Valkoiset muovipöydät	9	2	2026-05-24 21:21:49.697128	\N	\N
454	46	16	TV virtakaapeli ja hdmi kaapeli	10	1	2026-05-24 21:21:49.697128	\N	\N
455	46	17	info-tv	11	1	2026-05-24 21:21:49.697128	\N	\N
456	46	21	Toimistotuolit	15	2	2026-05-24 21:21:49.697128	\N	\N
457	46	25	Vaneripöydät E	19	3	2026-05-24 21:21:49.697128	\N	\N
458	46	42	Tv lattiajalat	36	1	2026-05-24 21:21:49.697128	\N	\N
459	46	48	Sähköt 3x16A 400V 9000W	42	1	2026-05-24 21:21:49.697128	\N	\N
460	46	107	Iso kaapelisuoja	iso-kaapelisuoja	1	2026-05-24 21:21:49.697128	\N	\N
461	46	110	Jatkojohto 5m 3-plugia	jatkojohto-5m-3-plugia	1	2026-05-24 21:21:49.697128	\N	\N
476	49	13	Tuoli	7	2	2026-05-24 21:35:17.788484	\N	\N
766	43	27	Pelinäyttö	21	10	2026-05-29 21:31:47.051021	\N	\N
767	43	39	Tehokone	33	10	2026-05-29 21:31:47.051021	\N	\N
23	5	11	Verkkokaapeli	5	7	2026-04-06 17:51:53.256577	\N	\N
24	5	12	1G Base-T -verkko	6	7	2026-04-06 17:51:53.256577	\N	\N
25	5	13	Tuoli	7	10	2026-04-06 17:51:53.256577	\N	\N
26	5	15	Valkoiset muovipöydät	9	2	2026-04-06 17:51:53.256577	\N	\N
27	5	16	TV virtakaapeli ja hdmi kaapeli	10	1	2026-04-06 17:51:53.256577	\N	\N
28	5	17	info-tv	11	2	2026-04-06 17:51:53.256577	\N	\N
29	5	25	Vaneripöydät E	19	2	2026-04-06 17:51:53.256577	\N	\N
30	5	41	Medialäppäri	35	7	2026-04-06 17:51:53.256577	\N	\N
31	5	44	Tv pöytäjalat	38	1	2026-04-06 17:51:53.256577	\N	\N
32	5	46	Kuluttaja-tv	40	1	2026-04-06 17:51:53.256577	\N	\N
33	5	51	Esperanza EG102 - peliohjain	45	1	2026-04-06 17:51:53.256577	\N	\N
34	5	52	Sähköt 1x16A 230V 3000W	46	1	2026-04-06 17:51:53.256577	\N	\N
768	43	40	Sähköt 3x32A 400V 15000W	34	1	2026-05-29 21:31:47.051021	\N	\N
769	43	117	Jatkojohto 5m 6-plugia	jatkojohto-5m-6-plugia	4	2026-05-29 21:31:47.051021	\N	\N
770	43	114	Cisco/Tandberg TTC8-02 robotti kamera	cisco-tandberg-ttc8-02-robotti	1	2026-05-29 21:31:47.051021	\N	\N
771	43	12	1G Base-T -verkko	6	1	2026-05-29 21:31:47.051021	\N	\N
772	43	11	Verkkokaapeli	5	10	2026-05-29 21:31:47.051021	\N	\N
773	43	50	Vaneripöydät B	44	4	2026-05-29 21:31:47.051021	\N	\N
774	43	21	Toimistotuolit	15	10	2026-05-29 21:31:47.051021	\N	\N
42	7	55	Vaneripöydät G	49	96	2026-04-15 20:29:20.339572	\N	\N
43	7	13	Tuoli	7	216	2026-04-15 20:29:20.339572	\N	\N
881	6	13	Tuoli	7	20	2026-06-01 14:59:25.113171	\N	\N
882	6	60	Sähköt Muu	54	1	2026-06-01 14:59:25.113171	\N	\N
883	6	93	Mikro	87	1	2026-06-01 14:59:25.113171	\N	\N
884	6	102	Valkoinen jääkaappi	valkoinen-j-kaappi	3	2026-06-01 14:59:25.113171	\N	\N
81	11	13	Tuoli	7	8	2026-05-09 08:21:08.650754	\N	\N
82	11	34	Vaneripöydät C	28	8	2026-05-09 08:21:08.650754	\N	\N
83	11	48	Sähköt 3x16A 400V 9000W	42	1	2026-05-09 08:21:08.650754	\N	\N
100	10	12	1G Base-T -verkko	6	11	2026-05-11 06:37:15.205218	\N	\N
101	10	13	Tuoli	7	11	2026-05-11 06:37:15.205218	\N	\N
102	10	34	Vaneripöydät C	28	4	2026-05-11 06:37:15.205218	\N	\N
103	10	48	Sähköt 3x16A 400V 9000W	42	1	2026-05-11 06:37:15.205218	\N	\N
108	15	12	1G Base-T -verkko	6	10	2026-05-11 07:01:59.713004	\N	\N
109	15	25	Vaneripöydät E	19	5	2026-05-11 07:01:59.713004	\N	\N
110	15	34	Vaneripöydät C	28	2	2026-05-11 07:01:59.713004	\N	\N
111	15	83	Info	\N	0	2026-05-11 07:01:59.713004	3	\N
112	15	83	Vaneripöydät F-info	77	10	2026-05-11 07:01:59.713004	3	111
113	15	48	Sähköt 3x16A 400V 9000W	42	1	2026-05-11 07:01:59.713004	3	111
118	17	50	Vaneripöydät B	44	1	2026-05-11 11:33:17.413367	\N	\N
119	17	52	Sähköt 1x16A 230V 3000W	46	1	2026-05-11 11:33:17.413367	\N	\N
120	17	92	Metallinen jääkaappi	86	2	2026-05-11 11:33:17.413367	\N	\N
121	17	93	Mikro	87	2	2026-05-11 11:33:17.413367	\N	\N
122	17	104	Vesiastia	vesiastia	2	2026-05-11 11:33:17.413367	\N	\N
136	13	12	1G Base-T -verkko	6	14	2026-05-12 15:53:54.31407	\N	\N
137	13	13	Tuoli	7	14	2026-05-12 15:53:54.31407	\N	\N
138	13	52	Sähköt 1x16A 230V 3000W	46	2	2026-05-12 15:53:54.31407	\N	\N
139	13	55	Vaneripöydät G	49	2	2026-05-12 15:53:54.31407	\N	\N
140	13	63	Vaneripöydät H	57	5	2026-05-12 15:53:54.31407	\N	\N
141	13	34	Vaneripöydät C	28	2	2026-05-12 15:53:54.31407	\N	\N
142	13	16	TV virtakaapeli ja hdmi kaapeli	10	2	2026-05-12 15:53:54.31407	\N	\N
143	13	44	Tv pöytäjalat	38	2	2026-05-12 15:53:54.31407	\N	\N
144	13	46	Kuluttaja-tv	40	2	2026-05-12 15:53:54.31407	\N	\N
145	4	40	Sähköt 3x32A 400V 15000W	34	1	2026-05-14 16:02:19.261808	\N	\N
146	4	55	Vaneripöydät G	49	10	2026-05-14 16:02:19.261808	\N	\N
147	4	8	10G LR -verkko	2	1	2026-05-14 16:02:19.261808	\N	\N
148	4	17	info-tv	11	4	2026-05-14 16:02:19.261808	\N	\N
152	19	11	Verkkokaapeli	5	10	2026-05-14 16:19:04.936965	\N	\N
153	19	12	1G Base-T -verkko	6	5	2026-05-14 16:19:04.936965	\N	\N
154	19	13	Tuoli	7	7	2026-05-14 16:19:04.936965	\N	\N
155	19	15	Valkoiset muovipöydät	9	1	2026-05-14 16:19:04.936965	\N	\N
156	19	17	info-tv	11	1	2026-05-14 16:19:04.936965	\N	\N
157	19	18	Toimistohiiri	12	5	2026-05-14 16:19:04.936965	\N	\N
158	19	25	Vaneripöydät E	19	2	2026-05-14 16:19:04.936965	\N	\N
159	19	31	PROVO Matto - Hiirimatto	25	5	2026-05-14 16:19:04.936965	\N	\N
160	19	41	Medialäppäri	35	5	2026-05-14 16:19:04.936965	\N	\N
161	19	42	Tv lattiajalat	36	1	2026-05-14 16:19:04.936965	\N	\N
162	19	44	Tv pöytäjalat	38	1	2026-05-14 16:19:04.936965	\N	\N
163	19	46	Kuluttaja-tv	40	1	2026-05-14 16:19:04.936965	\N	\N
164	19	64	Sähköt 230V	58	1	2026-05-14 16:19:04.936965	\N	\N
165	19	84	Sohva	78	1	2026-05-14 16:19:04.936965	\N	\N
166	20	11	Verkkokaapeli	5	4	2026-05-14 16:28:45.825814	\N	\N
167	20	12	1G Base-T -verkko	6	2	2026-05-14 16:28:45.825814	\N	\N
168	20	13	Tuoli	7	2	2026-05-14 16:28:45.825814	\N	\N
169	20	17	info-tv	11	1	2026-05-14 16:28:45.825814	\N	\N
170	20	28	Ikeapöydät	22	1	2026-05-14 16:28:45.825814	\N	\N
171	20	42	Tv lattiajalat	36	1	2026-05-14 16:28:45.825814	\N	\N
172	20	64	Sähköt 230V	58	1	2026-05-14 16:28:45.825814	\N	\N
173	21	9	Valaistus	3	3	2026-05-14 16:38:01.958539	\N	\N
174	21	11	Verkkokaapeli	5	2	2026-05-14 16:38:01.958539	\N	\N
175	21	12	1G Base-T -verkko	6	1	2026-05-14 16:38:01.958539	\N	\N
176	21	13	Tuoli	7	2	2026-05-14 16:38:01.958539	\N	\N
177	21	15	Valkoiset muovipöydät	9	1	2026-05-14 16:38:01.958539	\N	\N
178	21	50	Vaneripöydät B	44	2	2026-05-14 16:38:01.958539	\N	\N
179	21	64	Sähköt 230V	58	1	2026-05-14 16:38:01.958539	\N	\N
211	25	9	Valaistus	3	1	2026-05-17 10:47:43.576848	\N	\N
212	25	13	Tuoli	7	6	2026-05-17 10:47:43.576848	\N	\N
213	25	50	Vaneripöydät B	44	1	2026-05-17 10:47:43.576848	\N	\N
214	25	52	Sähköt 1x16A 230V 3000W	46	1	2026-05-17 10:47:43.576848	\N	\N
184	23	11	Verkkokaapeli	5	12	2026-05-14 17:55:47.105356	\N	\N
185	23	12	1G Base-T -verkko	6	6	2026-05-14 17:55:47.105356	\N	\N
186	23	13	Tuoli	7	6	2026-05-14 17:55:47.105356	\N	\N
187	23	25	Vaneripöydät E	19	3	2026-05-14 17:55:47.105356	\N	\N
188	23	64	Sähköt 230V	58	1	2026-05-14 17:55:47.105356	\N	\N
189	24	11	Verkkokaapeli	5	5	2026-05-15 06:21:26.117635	\N	\N
190	24	61	HR Nakkikioski	\N	0	2026-05-15 06:21:26.117635	8	\N
191	24	61	Spottivalot	55	2	2026-05-15 06:21:26.117635	8	190
192	24	48	Sähköt 3x16A 400V 9000W	42	1	2026-05-15 06:21:26.117635	8	190
193	24	12	1G Base-T -verkko	6	5	2026-05-15 06:21:26.117635	8	190
194	24	112	Ikea tvärhand pöytälamppu	ikea-tv-rhand-p-yt-lamppu	1	2026-05-15 06:21:26.117635	8	190
195	24	64	Sähköt 230V	58	1	2026-05-15 06:21:26.117635	8	190
196	24	13	Tuoli	7	5	2026-05-15 06:21:26.117635	8	190
197	24	50	Vaneripöydät B	44	3	2026-05-15 06:21:26.117635	8	190
198	24	9	HR Hiljainen tila	\N	0	2026-05-15 06:21:26.117635	9	\N
199	24	9	Valaistus	3	6	2026-05-15 06:21:26.117635	9	198
200	24	85	Säkkituoli	79	2	2026-05-15 06:21:26.117635	9	198
629	12	16	TV virtakaapeli ja hdmi kaapeli	10	6	2026-05-27 17:00:12.08263	\N	\N
216	26	34	Vaneripöydät C	28	2	2026-05-18 05:45:48.745409	\N	\N
217	26	13	Tuoli	7	3	2026-05-18 05:45:48.745409	\N	\N
218	26	17	info-tv	11	1	2026-05-18 05:45:48.745409	\N	\N
219	26	16	TV virtakaapeli ja hdmi kaapeli	10	1	2026-05-18 05:45:48.745409	\N	\N
206	22	13	Tuoli	7	20	2026-05-17 10:43:09.504	\N	\N
207	22	50	Vaneripöydät B	44	7	2026-05-17 10:43:09.504	\N	\N
208	22	61	Spottivalot	55	2	2026-05-17 10:43:09.504	\N	\N
209	22	64	Sähköt 230V	58	1	2026-05-17 10:43:09.504	\N	\N
210	22	9	Valaistus	3	2	2026-05-17 10:43:09.504	\N	\N
220	26	47	TV Trussi-kiinnitys	41	1	2026-05-18 05:45:48.745409	\N	\N
221	26	52	Sähköt 1x16A 230V 3000W	46	1	2026-05-18 05:45:48.745409	\N	\N
222	26	12	1G Base-T -verkko	6	2	2026-05-18 05:45:48.745409	\N	\N
223	26	11	Verkkokaapeli	5	2	2026-05-18 05:45:48.745409	\N	\N
224	26	7	Ständialueen matotus per neliömetri	1	16	2026-05-18 05:45:48.745409	\N	\N
225	26	56	Standipaketti 4x4m	50	1	2026-05-18 05:45:48.745409	\N	\N
226	26	9	Valaistus	3	1	2026-05-18 05:45:48.745409	\N	\N
630	12	46	Kuluttaja-tv	40	2	2026-05-27 17:00:12.08263	\N	\N
631	12	44	Tv pöytäjalat	38	2	2026-05-27 17:00:12.08263	\N	\N
885	6	15	Valkoiset muovipöydät	9	7	2026-06-01 14:59:25.113171	\N	\N
886	6	34	Vaneripöydät C	28	4	2026-06-01 14:59:25.113171	\N	\N
887	6	12	1G Base-T -verkko	6	1	2026-06-01 14:59:25.113171	\N	\N
888	6	112	Ikea tvärhand pöytälamppu	ikea-tv-rhand-p-yt-lamppu	5	2026-06-01 14:59:25.113171	\N	\N
889	6	90	Jääkaappipakastin	84	1	2026-06-01 14:59:25.113171	\N	\N
890	6	84	Sohva	78	1	2026-06-01 14:59:25.113171	\N	\N
891	6	9	Valaistus	3	1	2026-06-01 14:59:25.113171	\N	\N
912	61	15	Valkoiset muovipöydät	9	6	2026-06-03 07:47:13.177529	\N	\N
913	61	34	Vaneripöydät C	28	6	2026-06-03 07:47:13.177529	\N	\N
916	8	12	1G Base-T -verkko	6	144	2026-06-03 12:11:10.636197	\N	\N
917	8	13	Tuoli	7	36	2026-06-03 12:11:10.636197	\N	\N
240	29	11	Verkkokaapeli	5	4	2026-05-18 05:54:54.252943	\N	\N
241	29	12	1G Base-T -verkko	6	2	2026-05-18 05:54:54.252943	\N	\N
242	30	52	Sähköt 1x16A 230V 3000W	46	1	2026-05-18 05:57:45.087244	\N	\N
687	56	12	1G Base-T -verkko	6	5	2026-05-29 06:51:59.914397	\N	\N
688	56	13	Tuoli	7	5	2026-05-29 06:51:59.914397	\N	\N
689	56	16	TV virtakaapeli ja hdmi kaapeli	10	1	2026-05-29 06:51:59.914397	\N	\N
690	56	34	Vaneripöydät C	28	1	2026-05-29 06:51:59.914397	\N	\N
691	56	44	Tv pöytäjalat	38	1	2026-05-29 06:51:59.914397	\N	\N
692	56	46	Kuluttaja-tv	40	1	2026-05-29 06:51:59.914397	\N	\N
266	32	9	Valaistus	3	1	2026-05-18 06:14:00.216176	\N	\N
267	32	101	Mellakka-aita	mellakka-aita	7	2026-05-18 06:14:00.216176	\N	\N
268	18	16	TV virtakaapeli ja hdmi kaapeli	10	3	2026-05-19 18:25:55.752001	\N	\N
693	56	52	Sähköt 1x16A 230V 3000W	46	1	2026-05-29 06:51:59.914397	\N	\N
694	56	55	Vaneripöydät G	49	2	2026-05-29 06:51:59.914397	\N	\N
700	58	110	Kävijöiden hiljainen tila	\N	0	2026-05-29 07:40:20.203786	10	\N
701	58	110	Jatkojohto 5m 3-plugia	jatkojohto-5m-3-plugia	1	2026-05-29 07:40:20.203786	10	700
702	58	85	Säkkituoli	79	2	2026-05-29 07:40:20.203786	10	700
703	58	9	Valaistus	3	1	2026-05-29 07:40:20.203786	10	700
718	35	9	Valaistus	3	1	2026-05-29 21:27:42.536418	\N	\N
719	35	11	Verkkokaapeli	5	2	2026-05-29 21:27:42.536418	\N	\N
720	35	12	1G Base-T -verkko	6	1	2026-05-29 21:27:42.536418	\N	\N
721	35	13	Tuoli	7	46	2026-05-29 21:27:42.536418	\N	\N
722	35	15	Valkoiset muovipöydät	9	11	2026-05-29 21:27:42.536418	\N	\N
723	35	52	Sähköt 1x16A 230V 3000W	46	1	2026-05-29 21:27:42.536418	\N	\N
724	35	109	Jatkojohto 1.5m 3-plugia	jatkojohto-1-5m-3-plugia	6	2026-05-29 21:27:42.536418	\N	\N
725	35	112	Ikea tvärhand pöytälamppu	ikea-tv-rhand-p-yt-lamppu	11	2026-05-29 21:27:42.536418	\N	\N
269	18	17	info-tv	11	3	2026-05-19 18:25:55.752001	\N	\N
270	18	41	Medialäppäri	35	1	2026-05-19 18:25:55.752001	\N	\N
271	18	21	Toimistotuolit	15	8	2026-05-19 18:25:55.752001	\N	\N
632	54	34	Vaneripöydät C	28	1	2026-05-28 07:00:04.328348	\N	\N
633	54	52	Sähköt 1x16A 230V 3000W	46	1	2026-05-28 07:00:04.328348	\N	\N
634	54	116	Jatkojohto 5m 4-plugia	jatkojohto-5m-4-plugia	1	2026-05-28 07:00:04.328348	\N	\N
892	60	21	Toimistotuolit	15	6	2026-06-02 11:31:32.889863	\N	\N
914	62	21	Toimistotuolit	15	4	2026-06-03 08:27:39.850194	\N	\N
918	8	48	Sähköt 3x16A 400V 9000W	42	4	2026-06-03 12:11:10.636197	\N	\N
671	50	11	Verkkokaapeli	5	3	2026-05-28 18:41:38.572109	\N	\N
672	50	12	1G Base-T -verkko	6	1	2026-05-28 18:41:38.572109	\N	\N
673	50	13	Tuoli	7	5	2026-05-28 18:41:38.572109	\N	\N
462	47	11	Verkkokaapeli	5	2	2026-05-24 21:25:19.055954	\N	\N
463	47	12	1G Base-T -verkko	6	1	2026-05-24 21:25:19.055954	\N	\N
464	47	13	Tuoli	7	4	2026-05-24 21:25:19.055954	\N	\N
465	47	15	Valkoiset muovipöydät	9	2	2026-05-24 21:25:19.055954	\N	\N
466	47	109	Jatkojohto 1.5m 3-plugia	jatkojohto-1-5m-3-plugia	2	2026-05-24 21:25:19.055954	\N	\N
477	49	15	Valkoiset muovipöydät	9	2	2026-05-24 21:35:17.788484	\N	\N
478	49	40	Sähköt 3x32A 400V 15000W	34	1	2026-05-24 21:35:17.788484	\N	\N
919	8	25	Vaneripöydät E	19	18	2026-06-03 12:11:10.636197	\N	\N
920	8	50	Vaneripöydät B	44	10	2026-06-03 12:11:10.636197	\N	\N
921	8	34	Vaneripöydät C	28	6	2026-06-03 12:11:10.636197	\N	\N
923	65	21	Toimistotuolit	15	1	2026-06-03 12:30:48.068484	\N	\N
503	48	7	Ständialueen matotus per neliömetri	1	16	2026-05-24 21:59:08.386371	\N	\N
504	48	9	Valaistus	3	1	2026-05-24 21:59:08.386371	\N	\N
505	48	11	Verkkokaapeli	5	3	2026-05-24 21:59:08.386371	\N	\N
506	48	12	1G Base-T -verkko	6	1	2026-05-24 21:59:08.386371	\N	\N
507	48	13	Tuoli	7	2	2026-05-24 21:59:08.386371	\N	\N
508	48	40	Sähköt 3x32A 400V 15000W	34	1	2026-05-24 21:59:08.386371	\N	\N
509	48	50	Vaneripöydät B	44	2	2026-05-24 21:59:08.386371	\N	\N
510	48	56	Standipaketti 4x4m	50	1	2026-05-24 21:59:08.386371	\N	\N
511	48	109	Jatkojohto 1.5m 3-plugia	jatkojohto-1-5m-3-plugia	3	2026-05-24 21:59:08.386371	\N	\N
674	50	15	Valkoiset muovipöydät	9	1	2026-05-28 18:41:38.572109	\N	\N
675	50	56	Standipaketti 4x4m	50	1	2026-05-28 18:41:38.572109	\N	\N
676	50	60	Sähköt Muu	54	1	2026-05-28 18:41:38.572109	\N	\N
677	50	109	Jatkojohto 1.5m 3-plugia	jatkojohto-1-5m-3-plugia	4	2026-05-28 18:41:38.572109	\N	\N
311	31	9	Valaistus	3	1	2026-05-21 16:36:09.463405	\N	\N
312	31	11	Verkkokaapeli	5	2	2026-05-21 16:36:09.463405	\N	\N
313	31	12	1G Base-T -verkko	6	1	2026-05-21 16:36:09.463405	\N	\N
314	31	13	Tuoli	7	3	2026-05-21 16:36:09.463405	\N	\N
315	31	41	Medialäppäri	35	1	2026-05-21 16:36:09.463405	\N	\N
316	31	48	Sähköt 3x16A 400V 9000W	42	1	2026-05-21 16:36:09.463405	\N	\N
317	31	55	Vaneripöydät G	49	4	2026-05-21 16:36:09.463405	\N	\N
318	31	86	Lasiovinen jääkaappi	80	1	2026-05-21 16:36:09.463405	\N	\N
319	31	87	Lasi-ikkunallinen arkkupakastin	81	1	2026-05-21 16:36:09.463405	\N	\N
320	31	112	Ikea tvärhand pöytälamppu	ikea-tv-rhand-p-yt-lamppu	2	2026-05-21 16:36:09.463405	\N	\N
321	31	91	Kylmälaari	85	1	2026-05-21 16:36:09.463405	\N	\N
322	31	93	Mikro	87	1	2026-05-21 16:36:09.463405	\N	\N
323	31	81	Kiertoilmauuni	75	1	2026-05-21 16:36:09.463405	\N	\N
324	31	17	info-tv	11	1	2026-05-21 16:36:09.463405	\N	\N
325	31	42	Tv lattiajalat	36	1	2026-05-21 16:36:09.463405	\N	\N
326	31	16	TV virtakaapeli ja hdmi kaapeli	10	1	2026-05-21 16:36:09.463405	\N	\N
678	50	7	Ständialueen matotus per neliömetri	1	1	2026-05-28 18:41:38.572109	\N	\N
695	28	60	Sähköt Muu	54	1	2026-05-29 07:10:13.983142	\N	\N
704	59	9	HR Hiljainen tila	\N	0	2026-05-29 07:41:03.086556	9	\N
705	59	9	Valaistus	3	2	2026-05-29 07:41:03.086556	9	704
706	59	109	Jatkojohto 1.5m 3-plugia	jatkojohto-1-5m-3-plugia	3	2026-05-29 07:41:03.086556	9	704
707	59	122	Patja	patja	2	2026-05-29 07:41:03.086556	9	704
726	35	21	Toimistotuolit	15	2	2026-05-29 21:27:42.536418	\N	\N
363	37	16	TV virtakaapeli ja hdmi kaapeli	10	1	2026-05-23 15:17:20.066699	\N	\N
562	41	11	Verkkokaapeli	5	1	2026-05-24 22:10:57.430116	\N	\N
563	41	12	1G Base-T -verkko	6	1	2026-05-24 22:10:57.430116	\N	\N
564	41	110	Jatkojohto 5m 3-plugia	jatkojohto-5m-3-plugia	1	2026-05-24 22:10:57.430116	\N	\N
364	37	17	info-tv	11	1	2026-05-23 15:17:20.066699	\N	\N
365	37	42	Tv lattiajalat	36	1	2026-05-23 15:17:20.066699	\N	\N
366	38	9	Valaistus	3	3	2026-05-24 10:13:59.548236	\N	\N
367	38	11	Verkkokaapeli	5	2	2026-05-24 10:13:59.548236	\N	\N
368	38	12	1G Base-T -verkko	6	1	2026-05-24 10:13:59.548236	\N	\N
369	38	13	Tuoli	7	4	2026-05-24 10:13:59.548236	\N	\N
370	38	25	Vaneripöydät E	19	5	2026-05-24 10:13:59.548236	\N	\N
371	38	52	Sähköt 1x16A 230V 3000W	46	1	2026-05-24 10:13:59.548236	\N	\N
372	38	112	Ikea tvärhand pöytälamppu	ikea-tv-rhand-p-yt-lamppu	1	2026-05-24 10:13:59.548236	\N	\N
373	39	40	Sähköt 3x32A 400V 15000W	34	1	2026-05-24 10:52:46.293496	\N	\N
374	39	110	Jatkojohto 5m 3-plugia	jatkojohto-5m-3-plugia	6	2026-05-24 10:52:46.293496	\N	\N
635	55	12	1G Base-T -verkko	6	22	2026-05-28 17:32:45.70741	\N	\N
636	55	13	Tuoli	7	22	2026-05-28 17:32:45.70741	\N	\N
637	55	34	Vaneripöydät C	28	10	2026-05-28 17:32:45.70741	\N	\N
638	55	48	Sähköt 3x16A 400V 9000W	42	1	2026-05-28 17:32:45.70741	\N	\N
382	40	9	Valaistus	3	2	2026-05-24 10:59:49.504897	\N	\N
383	40	13	Tuoli	7	4	2026-05-24 10:59:49.504897	\N	\N
384	40	50	Vaneripöydät B	44	10	2026-05-24 10:59:49.504897	\N	\N
385	40	80	Arkkupakastin	74	1	2026-05-24 10:59:49.504897	\N	\N
386	40	90	Jääkaappipakastin	84	1	2026-05-24 10:59:49.504897	\N	\N
893	44	9	Valaistus	3	1	2026-06-02 12:04:44.833144	\N	\N
894	44	11	Verkkokaapeli	5	9	2026-06-02 12:04:44.833144	\N	\N
895	44	12	1G Base-T -verkko	6	2	2026-06-02 12:04:44.833144	\N	\N
896	44	15	Valkoiset muovipöydät	9	7	2026-06-02 12:04:44.833144	\N	\N
897	44	16	TV virtakaapeli ja hdmi kaapeli	10	3	2026-06-02 12:04:44.833144	\N	\N
898	44	17	info-tv	11	3	2026-06-02 12:04:44.833144	\N	\N
899	44	21	Toimistotuolit	15	8	2026-06-02 12:04:44.833144	\N	\N
900	44	27	Pelinäyttö	21	12	2026-06-02 12:04:44.833144	\N	\N
901	44	31	PROVO Matto - Hiirimatto	25	8	2026-06-02 12:04:44.833144	\N	\N
902	44	32	PROVO KUMU PRO - 7.1 tilaäänipelikuuloke	26	8	2026-06-02 12:04:44.833144	\N	\N
903	44	37	PROVO NOSTE PRO - hiiri	31	8	2026-06-02 12:04:44.833144	\N	\N
904	44	38	PROVO KAJO OPTO - Näppäimistö	32	8	2026-06-02 12:04:44.833144	\N	\N
905	44	39	Tehokone	33	5	2026-06-02 12:04:44.833144	\N	\N
404	42	7	Ständialueen matotus per neliömetri	1	16	2026-05-24 18:55:46.518558	\N	\N
405	42	9	Valaistus	3	1	2026-05-24 18:55:46.518558	\N	\N
406	42	13	Tuoli	7	4	2026-05-24 18:55:46.518558	\N	\N
407	42	16	TV virtakaapeli ja hdmi kaapeli	10	1	2026-05-24 18:55:46.518558	\N	\N
408	42	17	info-tv	11	1	2026-05-24 18:55:46.518558	\N	\N
409	42	41	Medialäppäri	35	1	2026-05-24 18:55:46.518558	\N	\N
410	42	42	Tv lattiajalat	36	1	2026-05-24 18:55:46.518558	\N	\N
411	42	56	Standipaketti 4x4m	50	1	2026-05-24 18:55:46.518558	\N	\N
412	42	109	Jatkojohto 1.5m 3-plugia	jatkojohto-1-5m-3-plugia	2	2026-05-24 18:55:46.518558	\N	\N
413	34	11	Verkkokaapeli	5	5	2026-05-24 19:15:16.171271	\N	\N
414	34	12	1G Base-T -verkko	6	1	2026-05-24 19:15:16.171271	\N	\N
415	34	13	Tuoli	7	5	2026-05-24 19:15:16.171271	\N	\N
416	34	34	Vaneripöydät C	28	2	2026-05-24 19:15:16.171271	\N	\N
417	34	110	Jatkojohto 5m 3-plugia	jatkojohto-5m-3-plugia	2	2026-05-24 19:15:16.171271	\N	\N
868	9	11	Verkkokaapeli	5	4	2026-05-30 12:31:44.168865	\N	\N
869	9	12	1G Base-T -verkko	6	2	2026-05-30 12:31:44.168865	\N	\N
512	45	11	Verkkokaapeli	5	6	2026-05-24 22:00:11.336807	\N	\N
513	45	12	1G Base-T -verkko	6	1	2026-05-24 22:00:11.336807	\N	\N
514	45	13	Tuoli	7	40	2026-05-24 22:00:11.336807	\N	\N
515	45	34	Vaneripöydät C	28	4	2026-05-24 22:00:11.336807	\N	\N
516	45	52	Sähköt 1x16A 230V 3000W	46	1	2026-05-24 22:00:11.336807	\N	\N
517	45	117	Jatkojohto 5m 6-plugia	jatkojohto-5m-6-plugia	4	2026-05-24 22:00:11.336807	\N	\N
870	9	13	Tuoli	7	30	2026-05-30 12:31:44.168865	\N	\N
871	9	15	Valkoiset muovipöydät	9	1	2026-05-30 12:31:44.168865	\N	\N
872	9	16	TV virtakaapeli ja hdmi kaapeli	10	11	2026-05-30 12:31:44.168865	\N	\N
873	9	17	info-tv	11	5	2026-05-30 12:31:44.168865	\N	\N
874	9	25	Vaneripöydät E	19	20	2026-05-30 12:31:44.168865	\N	\N
875	9	40	Sähköt 3x32A 400V 15000W	34	1	2026-05-30 12:31:44.168865	\N	\N
876	9	42	Tv lattiajalat	36	8	2026-05-30 12:31:44.168865	\N	\N
554	36	9	Valaistus	3	1	2026-05-24 22:02:43.889841	\N	\N
555	36	11	Verkkokaapeli	5	9	2026-05-24 22:02:43.889841	\N	\N
556	36	12	1G Base-T -verkko	6	1	2026-05-24 22:02:43.889841	\N	\N
557	36	16	TV virtakaapeli ja hdmi kaapeli	10	1	2026-05-24 22:02:43.889841	\N	\N
558	36	17	info-tv	11	1	2026-05-24 22:02:43.889841	\N	\N
559	36	42	Tv lattiajalat	36	1	2026-05-24 22:02:43.889841	\N	\N
560	36	48	Sähköt 3x16A 400V 9000W	42	1	2026-05-24 22:02:43.889841	\N	\N
561	36	50	Vaneripöydät B	44	5	2026-05-24 22:02:43.889841	\N	\N
565	41	118	Pienempi valkokangas	pienempi-valkokangas	1	2026-05-24 22:10:57.430116	\N	\N
877	9	44	Tv pöytäjalat	38	3	2026-05-30 12:31:44.168865	\N	\N
878	9	46	Kuluttaja-tv	40	2	2026-05-30 12:31:44.168865	\N	\N
879	9	101	Mellakka-aita	mellakka-aita	4	2026-05-30 12:31:44.168865	\N	\N
880	9	113	iFFALCON 55" U65 4K LED TV	iffalcon-55-u65-4k-led-tv	4	2026-05-30 12:31:44.168865	\N	\N
594	16	25	Vaneripöydät E	19	30	2026-05-25 13:28:31.327073	\N	\N
595	16	60	Sähköt Muu	54	1	2026-05-25 13:28:31.327073	\N	\N
596	16	63	Vaneripöydät H	57	3	2026-05-25 13:28:31.327073	\N	\N
597	16	100	Vaneripöydät Gk	94	23	2026-05-25 13:28:31.327073	\N	\N
598	16	13	Tuoli	7	150	2026-05-25 13:28:31.327073	\N	\N
599	52	113	iFFALCON 55" U65 4K LED TV	iffalcon-55-u65-4k-led-tv	2	2026-05-25 18:32:37.248273	\N	\N
600	53	16	TV virtakaapeli ja hdmi kaapeli	10	2	2026-05-26 18:18:10.108213	\N	\N
601	53	42	Tv lattiajalat	36	2	2026-05-26 18:18:10.108213	\N	\N
602	53	113	iFFALCON 55" U65 4K LED TV	iffalcon-55-u65-4k-led-tv	2	2026-05-26 18:18:10.108213	\N	\N
603	27	7	Ständialueen matotus per neliömetri	1	24	2026-05-27 13:37:00.642302	\N	\N
604	27	11	Verkkokaapeli	5	6	2026-05-27 13:37:00.642302	\N	\N
605	27	12	1G Base-T -verkko	6	3	2026-05-27 13:37:00.642302	\N	\N
606	27	13	Tuoli	7	10	2026-05-27 13:37:00.642302	\N	\N
607	27	15	Valkoiset muovipöydät	9	5	2026-05-27 13:37:00.642302	\N	\N
608	27	16	TV virtakaapeli ja hdmi kaapeli	10	1	2026-05-27 13:37:00.642302	\N	\N
609	27	17	info-tv	11	1	2026-05-27 13:37:00.642302	\N	\N
610	27	34	Vaneripöydät C	28	2	2026-05-27 13:37:00.642302	\N	\N
611	27	47	TV Trussi-kiinnitys	41	1	2026-05-27 13:37:00.642302	\N	\N
612	27	57	Standipaketti 6x4m	51	1	2026-05-27 13:37:00.642302	\N	\N
613	27	60	Sähköt Muu	54	1	2026-05-27 13:37:00.642302	\N	\N
614	27	61	Spottivalot	55	3	2026-05-27 13:37:00.642302	\N	\N
906	44	47	TV Trussi-kiinnitys	41	3	2026-06-02 12:04:44.833144	\N	\N
907	44	50	Vaneripöydät B	44	6	2026-06-02 12:04:44.833144	\N	\N
908	44	60	Sähköt Muu	54	1	2026-06-02 12:04:44.833144	\N	\N
909	44	84	Sohva	78	1	2026-06-02 12:04:44.833144	\N	\N
910	44	101	Mellakka-aita	mellakka-aita	6	2026-06-02 12:04:44.833144	\N	\N
911	44	115	Jatkojohto 1.5m 6-plugia	jatkojohto-1-5m-6-plugia	12	2026-06-02 12:04:44.833144	\N	\N
915	63	21	Toimistotuolit	15	1	2026-06-03 11:09:02.707328	\N	\N
922	64	21	Toimistotuolit	15	1	2026-06-03 12:23:20.165398	\N	\N
837	33	13	Tuoli	7	2	2026-05-30 12:28:49.912277	\N	\N
838	33	15	Valkoiset muovipöydät	9	1	2026-05-30 12:28:49.912277	\N	\N
839	33	16	TV virtakaapeli ja hdmi kaapeli	10	1	2026-05-30 12:28:49.912277	\N	\N
840	33	17	info-tv	11	1	2026-05-30 12:28:49.912277	\N	\N
841	33	18	Toimistohiiri	12	1	2026-05-30 12:28:49.912277	\N	\N
842	33	41	Medialäppäri	35	1	2026-05-30 12:28:49.912277	\N	\N
843	33	44	Tv pöytäjalat	38	1	2026-05-30 12:28:49.912277	\N	\N
857	51	9	Valaistus	3	1	2026-05-30 12:30:02.637538	\N	\N
858	51	13	Tuoli	7	2	2026-05-30 12:30:02.637538	\N	\N
859	51	15	Valkoiset muovipöydät	9	1	2026-05-30 12:30:02.637538	\N	\N
860	51	44	Tv pöytäjalat	38	1	2026-05-30 12:30:02.637538	\N	\N
861	51	46	Kuluttaja-tv	40	1	2026-05-30 12:30:02.637538	\N	\N
862	51	60	Sähköt Muu	54	1	2026-05-30 12:30:02.637538	\N	\N
863	51	84	Sohva	78	2	2026-05-30 12:30:02.637538	\N	\N
864	51	105	Pieni jääkaappi	pieni-j-kaappi	1	2026-05-30 12:30:02.637538	\N	\N
865	51	109	Jatkojohto 1.5m 3-plugia	jatkojohto-1-5m-3-plugia	3	2026-05-30 12:30:02.637538	\N	\N
866	51	110	Jatkojohto 5m 3-plugia	jatkojohto-5m-3-plugia	1	2026-05-30 12:30:02.637538	\N	\N
867	51	121	Sohvapöytä	sohvap-yt	1	2026-05-30 12:30:02.637538	\N	\N
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: infrashop
--

COPY public.orders (id, customer_name, organization, delivery_point, delivery_start, return_at, status, pdf_path, created_at, updated_at, event_id, special_requirements, open_comment) FROM stdin;
20	Ilpo Alatalo	Tarlab	Pärinä	2026-05-14 16:28:45.825814	2026-06-07 00:00:00	placed	\N	2026-05-14 16:28:45.825814	2026-05-14 16:28:45.825814	3	{"tv": "Tarlab", "power": "Läppäri, tv, ehkä pientä extraa", "network": "Vähintään yksi kone, yksi varalla, ei wifiä"}	\N
21	Ilpo Alatalo	Matsucon	Pärinä	2026-05-14 16:38:01.958539	2026-06-07 00:00:00	placed	\N	2026-05-14 16:38:01.958539	2026-05-14 16:38:01.958539	3	{"power": "Läppäri, valot", "network": "1 kone, ei wifiä", "lighting": "Matsu-kirppis on pari pöytää ja vaaterekki, valkoista/neutraalia valoa että näkee tuotteita"}	\N
3	Joni Tähtinen (Jstari)	Ensiapu	EA-kopin edusta	2026-04-02 16:03:44.38103	2026-06-07 00:00:00	placed	\N	2026-04-02 16:03:44.38103	2026-04-02 16:03:44.38103	3	\N	\N
5	Ilpo Alatalo	Pärinä	Artemis	2026-04-02 19:33:17.536709	2026-06-07 00:00:00	placed	\N	2026-04-02 19:33:17.536709	2026-04-06 17:51:53.256577	3	{"power": "Läppärit ja televisio", "network": "7, ei wifiä"}	
7	Kimmo	Pro-peliaule	Pro-pelialue	2026-04-15 20:11:55.344915	2026-06-07 00:00:00	placed	\N	2026-04-15 20:11:55.344915	2026-04-15 20:29:20.339572	3	\N	
8	Kimmo	Peruslanittajat	perusrivi	2026-04-15 20:54:21.275889	2026-06-07 00:00:00	placed	\N	2026-04-15 20:54:21.275889	2026-06-03 12:11:10.636197	3	{"power": "144 konepaikkaa 4 eri pöytäryhmää. 36 konepaikkaa/ryhmä."}	2 Riviä toteutuu, 1 varalta.
23	Ilpo Alatalo	PC Nostalgia	Pärinä	2026-05-14 17:55:47.105356	2026-06-07 00:00:00	placed	\N	2026-05-14 17:55:47.105356	2026-05-14 17:55:47.105356	3	{"power": "6 läppäriä", "network": "6 läppäriä, ei wifiä"}	Tulee Artemiksen kylkeen
11	Kimmo	Verkko	Verkon nurkkaus	2026-05-09 08:21:08.650754	2026-06-07 00:00:00	placed	\N	2026-05-09 08:21:08.650754	2026-05-09 08:21:08.650754	3	{"power": "Verkkotiimille sähkö. 14 konetta + muut laitteet"}	\N
24	Halla	HR	HR nakkikioski	2026-05-15 06:21:26.117635	2026-06-07 00:00:00	placed	\N	2026-05-15 06:21:26.117635	2026-05-15 06:21:26.117635	3	{"tv": "-", "power": "Läppäreitä.", "network": "Nakkikioskilla 5 läppäriä, kiinteä verkko tai wifi käytössä", "lighting": "Punaiset valot kävijöiden hiljaiseen tilaan. \\nSpottivalot loungeen. \\nPöytävalaisin nakkikioskille."}	\N
10	Kimmo	Live	Livelavan taka-alue	2026-05-09 08:18:16.784342	2026-06-07 00:00:00	placed	\N	2026-05-09 08:18:16.784342	2026-05-11 06:37:15.205218	3	{"power": "11 konetta ja näytöt.", "network": "11 konetta."}	Pöydät ja tuolit pinoihin. Pari sohvaa mukaan, jos jää ylimääräisiksi.
15	Kimmo	info	infopiste	2026-05-11 07:01:59.713004	2026-06-07 00:00:00	placed	\N	2026-05-11 07:01:59.713004	2026-05-11 07:01:59.713004	3	{"power": "4 henkilön koneet ja loput infon tarvikkeet", "network": "4 konetta + infon pöydät ja koneet + univalvoja"}	\N
17	Kimmo	Kodinkone nurkkaus	Kodinkone nurkkaus	2026-05-11 11:33:17.413367	2026-06-07 00:00:00	placed	\N	2026-05-11 11:33:17.413367	2026-05-11 11:33:17.413367	3	{"power": "Kaksi jääkaappia ja kaksi mikroa"}	Oltava ulkoisesti ja sisältä siisti. Asiakaskäyttöön.
16	Kimmo	Org	Org-alue	2026-05-11 07:04:04.138911	2026-06-07 00:00:00	placed	\N	2026-05-11 07:04:04.138911	2026-05-25 13:28:31.327073	3	{"power": "Sähköt Org alueelle"}	
28	naanatin	Insinööriliitto	Pärinä (Insinööriliitto)	2026-05-18 05:52:32.033602	2026-06-07 00:00:00	placed	\N	2026-05-18 05:52:32.033602	2026-05-29 07:10:13.983142	3	{"power": "Riittävä määrä sähköä yhdelle pienelle\\narkkupakastimelle"}	Yhdessä Rounds.gg:n kanssa
13	Kimmo	Premium 3E	3E	2026-05-10 18:32:35.671552	2026-06-07 00:00:00	placed	\N	2026-05-10 18:32:35.671552	2026-05-12 15:53:54.31407	3	{"power": "14 Konetta", "network": "14 konetta"}	
4	Live	Topi Jussila	Lavan taakse	2026-04-02 16:11:22.769743	2026-06-07 00:00:00	placed	\N	2026-04-02 16:11:22.769743	2026-05-14 16:02:19.261808	3	{"power": "Liven varastosta tavaraa + lavalla esiintyvien omaa kalustoa.", "network": "1 pelikone. 5 näyttöä 4 läppäriä. toimiva netti olisi tarpeen."}	Live
19	Ilpo Alatalo	Vauhtijuoksu	Pärinä	2026-05-14 16:19:04.936965	2026-06-07 00:00:00	placed	\N	2026-05-14 16:19:04.936965	2026-05-14 16:19:04.936965	3	{"tv": "Vauhtijuoksu", "power": "5 läppäriä ja 2 tv:tä", "network": "5 konetta, ei tarvi wifiä"}	\N
22	Ilpo Alatalo	Cryo	Pärinä	2026-05-14 16:47:06.455736	2026-06-07 00:00:00	placed	\N	2026-05-14 16:47:06.455736	2026-05-17 10:43:09.504	3	{"power": "Valot"}	Varjostimet spottivaloihin olisi "mui bueno" jos moisia on. Also kuulemma on jotain pöytälamppuja.
25	Ilpo Alatalo	Cryo (roolipeli)	Pärinä	2026-05-17 10:47:43.576848	2026-06-07 00:00:00	placed	\N	2026-05-17 10:47:43.576848	2026-05-17 10:47:43.576848	3	{"power": "Valot. Voinee jakaa sähköt toisen ständin kanssa.", "lighting": "Pöytä- tai spottivalo (tai jotain) roolipelipöydälle"}	Ei varmuutta tilaushetkellä tuleeko erilleen Cryon pää-ständistä vai onko samassa.
26	naanatin	OAMK	OAMK (Pärinä)	2026-05-18 05:42:48.399719	2026-06-07 00:00:00	placed	\N	2026-05-18 05:42:48.399719	2026-05-18 05:45:48.745409	3	\N	
29	naanatin	Deco	Yläkatsomo	2026-05-18 05:54:54.252943	2026-06-07 00:00:00	placed	\N	2026-05-18 05:54:54.252943	2026-05-18 05:54:54.252943	3	{"network": "Ledrama-verkko isoille kolmioille"}	\N
30	naanatin	Kävijät/Org	Nukkumasali	2026-05-18 05:57:45.087244	2026-06-07 00:00:00	placed	\N	2026-05-18 05:57:45.087244	2026-05-18 05:57:45.087244	3	{"power": "Jatkoroikkia nukkumatiloihin (järkät + kävijät) CPAP-laitteille.\\nTulostaulun sähköjen katkaisu to ennen nukkujien\\nsaapumista (mieluiten klo 20 mennessä)\\nTulostaulun virtojen takaisinkytkentä su klo 10 jälkeen"}	\N
32	naanatin	Deco	Konepaikka-alueen sisääntulo	2026-05-18 06:14:00.216176	2026-06-07 00:00:00	placed	\N	2026-05-18 06:14:00.216176	2026-05-18 06:14:00.216176	3	{"lighting": "Lediputket kaiteisiin.\\nNäkövalo turvalle portin molemmin puolin"}	\N
18	Kimmo	Viestintä/deco	Infon työpiste verhon kohdalle	2026-05-14 16:10:27.106182	2026-06-07 00:00:00	placed	\N	2026-05-14 16:10:27.106182	2026-05-19 18:25:55.752001	3	{"tv": "Viestinnän, valokuvatiimin ja Devon käyttöön org alueelle"}	Valokuvaukselle läppäri ja TV.\nRoskis ja pullomeri viestinnän pisteen lähelle
31	naanatin	Kioski	Kioski	2026-05-18 06:04:11.547001	2026-06-07 00:00:00	placed	\N	2026-05-18 06:04:11.547001	2026-05-21 16:36:09.463405	3	{"tv": "Kioski", "power": "kioskin sähkölaitteet (jääkaappi, pakastin, toaster,\\nkahvinkeitin, vedenkeitin jne.)", "network": "ainakin medialäppäri, maksupääte käyttänee wifiä tai mobiiliyhteyttä?", "lighting": "kioskille valoa sen verran että näkee keittää kahvia :)"}	
27	naanatin	Yliopisto	Yliopisto (Pärinä)	2026-05-18 05:51:21.811086	2026-06-07 00:00:00	placed	\N	2026-05-18 05:51:21.811086	2026-05-27 13:37:00.642302	3	{"tv": "voi olla myös jalallinen uusi TV", "power": "jopa 32A eli 22kW\\n(tulossa 3d-tulostimia ym)", "network": "3?"}	Sisältää myös standin vasemmalla puolella olevan YO VR pisteen, johon hyvä varata myös valovirtaa
12	Kimmo	Premium 1E	1E	2026-05-10 18:22:30.118016	2026-06-07 00:00:00	placed	\N	2026-05-10 18:22:30.118016	2026-05-27 17:00:12.08263	3	{"power": "23 tietokonetta ja näytöt.", "network": "23 konetta"}	
9	Ilpo Alatalo	AMIGAAA!	Pärinä	2026-04-30 18:02:36.919016	2026-06-07 00:00:00	placed	\N	2026-04-30 18:02:36.919016	2026-05-30 12:31:44.168865	3	{"tv": "5 Amigan korvamerkittyä\\n2 geneeristä", "power": "Ainakin 5 settiä Amiga + kajarit + TV", "network": "2, ei wifiä"}	Edit: Pelimuseon vehkeet tässä tilauksessa myös. Jos löytyy jostain lattiajalkoja niin niitä mieluummi
37	Health	Game	Ikäraja näyttö Striimikornerin suulle	2026-05-23 15:17:20.066699	2026-06-07 00:00:00	placed	\N	2026-05-23 15:17:20.066699	2026-05-23 15:17:20.066699	3	{"tv": "Striimikornerin sisäänkäynnille ikärajanäytöksi"}	\N
38	Ilpo Alatalo	Katja Printtaa Lohikäärmeitä	Pärinä	2026-05-24 10:13:59.548236	2026-06-07 00:00:00	placed	\N	2026-05-24 10:13:59.548236	2026-05-24 10:13:59.548236	3	{"tv": "Laitoin pöytälampun, tuli tämä", "power": "Neljä(?) 3D printteriä, en tiedä paljonko syövät sähköä tarkalleen", "network": "1 kone", "lighting": "Vähän valaistusta printtereille että näkee mitä tekee, jotain valaistusta myyntipöydälle"}	\N
39	Sähkö / PikkuPanda	-	-	2026-05-24 10:52:46.293496	2026-06-07 00:00:00	placed	\N	2026-05-24 10:52:46.293496	2026-05-24 10:52:46.293496	3	{"power": "Sähkön sisäinen muistilista!\\n\\n* 3000 W + 3000 W induction cookers\\n* 2000 W electric kettle\\n* 3000 W electric wok\\n* 2000 W deep fryer\\n* 2000 W microwave oven\\n* 2 work lights\\n* Enough extension cords"}	\N
40	Kimmo	Pikkupanda	Pikkupanda	2026-05-24 10:59:03.078735	2026-06-07 00:00:00	placed	\N	2026-05-24 10:59:03.078735	2026-05-24 10:59:49.504897	3	{"power": "* 3000 W + 3000 W induction cookers\\n* 2000 W electric kettle\\n* 3000 W electric wok\\n* 2000 W deep fryer\\n* 2000 W microwave oven\\nJatkojohdot oltava hyvät.", "lighting": "Työskentelyyn kirkassta valoa, joko spotilla tai muulla valolla."}	
41	Health	Game	Esports katsomo	2026-05-24 18:28:20.844841	2026-06-07 00:00:00	placed	\N	2026-05-24 18:28:20.844841	2026-05-24 22:10:57.430116	3	{"network": "voi vetää myös jostai päin striimikornerin aluetta tjsp mutta kuhan jostain langallinen verkko esports katsomon luo"}	Samanlainen tai -kaltainen kangas esports katsomoon ku viimeksi.\nVoidaan hakee jatkojohto ja verkkokaapeli myös itte ku nähään pituustarve
42	Health	Vectorama	Digipelirajattoman piste	2026-05-24 18:55:46.518558	2026-06-07 00:00:00	placed	\N	2026-05-24 18:55:46.518558	2026-05-24 18:55:46.518558	3	{"tv": "Digipelirajattoman pisteelle mitä ilmeisimmin pyörittämään powerpointtia", "lighting": "Laita vaikka työskentelyvalaistukseksi t. naana. Asiakkaan speksi: \\"ns. kirjoitusvalo, eli ylhäältä päin jos saisi spotteja että porukka näkee kirjoittaa post-it-lappuja, rastirata-lappuja, lukea QR-koodeja jne.\\""}	+ jotain sähköä jostain tm näytölle ja läppärille. loppu kevyemmät enkä kehtaa tilata raskaita
34	Health	Game	Gamelle koneiden värkkäyspiste kasauksen ajaksi jonnekki verkkoyhteyksien läheisyyteen	2026-05-23 13:04:20.365729	2026-06-07 00:00:00	placed	\N	2026-05-23 13:04:20.365729	2026-05-24 19:15:16.171271	3	{"power": "koneita kasauksen aikana kun niitä värkätään. ehkä viisi kerrallaan, varmistuu myöhemmin.", "network": "en tarvii wifiä ja arviolta ehkä viisi konetta kerralla. tarkentuu paikanpäällä. viisi kaapelia pls, tai voidaan hakee itte tarpeen mukaa. tullaan varmaan taas siihe johonki missä on vaan kätevin teille josta saahaan verkkoa."}	tarve-aika riippuu koneiden laskeutumisesta paikalle. Paikka jonnekin verkkoyhteyksien lähelle, ehkä tiistain aikana. voidaan vaikka ite kantaa ja hakee tavaroita myös kun paikka ja aika löytyy. aiemmin ollut taka-nosto-oven puoleisella puolella hallia seinustalla missä verkolla on verkkoa. sähkötki (ja verkko) voiaan vaan vetää jostai, kuha saahaa jostai.
35	Health	Game	Mtg-alue/lisä-lautapelitila	2026-05-23 13:22:28.241601	2026-06-07 00:00:00	placed	\N	2026-05-23 13:22:28.241601	2026-05-29 21:27:42.536418	3	{"tv": "en tarvii telkkaria, tää lisäkenttä tuli näkyviin kun valitsin pöytälamppuja. jos tän pitäs olla oikeesti niihin pöytälamppuihin liitännäinen, niin sitten 1 per pöytä.", "power": "en tiiä onks tää oikein tilattu :D korkeintaan ehkä kaksi konetta, ja ehkä 11kpl pöytälamppuja (riippuu decosta ja siitä miten ne mahtuu). voidaan hakee jatkojohdot itte kuhan nähää miten pitkiä tarvii vetää, montako, ja miten niitä saahaan vedeltyä järkevästi.", "network": "1 tai max 2 koneelle langallista sinne alueen perälle. voidaan hakea piuha myös itte ku tiedetään tarvittu pituus.", "lighting": "työvalaistus mtg/lautapeli-lisäalueelle. samankaltaisesti kuin viime vuosina. ylhäältä valo per pöytä ja varalta pöytävalo per pöytä?? + huom roolipelit perällä eri orientaatio, siihen voisi suunnata valon mahdollisesti jompaankumpaan päätyyn (ns. pelinjohtajalle valoksi)"}	alueen suunnitelman näkee pohjakartan välilehdeltä.
43	Health	Game	Non-Byoc (Striimikorneri)	2026-05-24 20:02:21.896812	2026-06-07 00:00:00	placed	\N	2026-05-24 20:02:21.896812	2026-05-29 21:31:47.051021	3	{"power": "10 konepaikkaa. Voi vetää myös muualta jos onnistuu, alkaa vaa loppua muut tuotteet infrashopista. Jatkojohdot voi olla mitä vaan kuha on vähintään 20 pistokepaikkaa, ei haittaa jos ylimääräsiä."}	Layout suunnitelman näkee pohjakartan striimikorneri-välilehdeltä\nEdit: Jostain syystä verkko oli tippunut alkuperäisestä tilauksesta. 10 konepaikkaa langallista.\nEdit: jos toimistotuolit on edustavassa kunnossa niin laitetaan muovituolien sijaa niitä.
36	Health	Ouka	Oukan ständi	2026-05-23 13:50:27.538225	2026-06-07 00:00:00	placed	\N	2026-05-23 13:50:27.538225	2026-05-24 22:02:43.889841	3	{"tv": "oukan ständille", "power": "9-10 konetta näyttöineen, infonäyttö sekä useampia oukan omia vehkeitä esim. \\"perus\\"valoja. n. 25 pistokepaikkaa jatkojohtoina.", "network": "about 9-10 konetta, ei wifiä. voi laittaa valmiiksi 5 tai 10m verkkokaapeleita mukaan sen verra, tai voin käskeä pyytämään tarvitunlaiset.", "lighting": "ouka toivoi valoputkia pisteelle, mietittiin naanan kaa että ainaki siihen kohdalle verhoihin vois saada. kattelkaa saatteko mitään muuta mutta jokunen jonkunlainen valoputki siihe!"}	Edit: 9 konetta aiemman sanotun sijaan.
33	Health	Game	Check-In Korneri	2026-05-23 12:38:39.182098	2026-06-07 00:00:00	placed	\N	2026-05-23 12:38:39.182098	2026-05-30 12:28:49.912277	3	{"tv": "check-in korneriin näytöksi joka näyttää kävijöille että täällä on check-in korneri. samanlaine tyylii ku viime vuonna, tosin lattiajalka olis kivempi. voidaan mennä myös pöytäjalalla, jos niitä tarvii priorisoida muualle, sitten tarvii ekstra pöydän. Info-tv voi myös vaihtaa tarvittaessa kuluttaja tv, kuha on sellanen jonka oikeesti näkee."}	viim keskiviikkona
46	Health	Game	Tappelupeliareena (Pärinällä)	2026-05-24 21:21:49.697128	2026-06-07 00:00:00	placed	\N	2026-05-24 21:21:49.697128	2026-05-24 21:21:49.697128	3	{"tv": "Tappelupeliareenalle Pärinällä. Voi olla myös kuluttaja-tv, mieluusti vaa lattiajalkakykyinen laite kuitenki.", "power": "n. 10+ pelipaikkaa (koneita tai konsoleita), 1-2 admin konetta, ja info-tv. Aiempaan malliin.", "network": "1-2 konetta, langallista."}	Layout suunnitelma löytyy pohjakartan tappelupeliareena-tabista, mutta se voi laitepaikkojen määrän osalta vielä elää.
47	Health	FGF	FGF ständi	2026-05-24 21:25:19.055954	2026-06-07 00:00:00	placed	\N	2026-05-24 21:25:19.055954	2026-05-24 21:25:19.055954	3	{"network": "1-2 langallista"}	+ perus sähköä parille laitteelle, loppunut varastosta. 5-6 pistokepaikkaa.
49	Health	Hieroja	Hieroja / Hierontapalvelu Jämpti (Pärinällä)	2026-05-24 21:35:17.788484	2026-06-07 00:00:00	placed	\N	2026-05-24 21:35:17.788484	2026-05-24 21:35:17.788484	3	{"power": "Perus sähkö asiakkaan tuomalle omalle lampulle ja pari ekstra pistokepaikkaa riittää, kevyemmät tuotteet loppu."}	\N
6	Ilta Pirttilahti	HR / Lounge	Lounge	2026-04-09 10:59:34.26959	2026-06-07 00:00:00	placed	\N	2026-04-09 10:59:34.26959	2026-06-01 14:59:25.113171	3	{"power": "Jääkaappeja, kahvinkeittimiä, mikro ja valoja"}	Lisäksi: punaiset sohvat, säkkituolit (niin monta, kuin saa), 1G base-T kahvikameralle, tarvitaan 2 kpl pullonkeräystä ja spottivaloja 2 kpl\n\nHuom. pöydistä annan varmistuksen myöhemmin, onko kaikki 10 muovisia vai tarvitaanko sittenkin osa vaneerisina. Saa tökkiä, jos varmistusta ei kuulu!\n\nKelmi kävi muokkaamassa Vaneripöytä-C tilaukseen testinä. Näitä voidaan toimittaa lisää. Etsitään sileäpintaista vaneripöytää
48	Health	RPKK	RPKK ständi	2026-05-24 21:32:00.77224	2026-06-07 00:00:00	placed	\N	2026-05-24 21:32:00.77224	2026-05-24 21:59:08.386371	3	{"power": "2-3 konepaikkaa oheislaitteineen sekä tv verran sähköä riittää, on vaan muut tuotteet loppu :)", "network": "2-3 koneelle langallista ja langat", "lighting": "Jonkinlaista lisävalaistusta, vaikka samalla lailla kuin viimeksi värillistä spottia muutama kipale."}	
45	Health	Game	CTF alue	2026-05-24 21:10:22.674712	2026-06-07 00:00:00	placed	\N	2026-05-24 21:10:22.674712	2026-05-24 22:00:11.336807	3	{"power": "Näitä piti tilata kaks mutta ei oo ku yks jäljel :) CTF alueelle sähköä, 4 pöytää. X määrä läppäreitä ja jatkojohdoista pistokkeita vaikka nyt väh. 5 per pöytä.", "network": "X määrä läppäreitä, vaikka jokunen kaapeli per pöytä. Mieluusti wifi-kattavuutta ainakin (ei välttämättä tarvii erillistä, ellette halua tehä). Ctf-pöytien netti, oherrala tietää."}	
52	Ville Alatalo	Deco	Deco	2026-05-25 18:32:37.248273	2026-06-07 00:00:00	placed	\N	2026-05-25 18:32:37.248273	2026-05-25 18:32:37.248273	3	{"tv": "org paikoille --> viestintä-deco-viestintä väliin"}	\N
53	oherrala	Verkko	Verkon nurkka	2026-05-26 18:18:10.108213	2026-06-07 00:00:00	placed	\N	2026-05-26 18:18:10.108213	2026-05-26 18:18:10.108213	3	{"tv": "verkon nurkka."}	Ainakin ennen ollut jalka, jossa kaksi telkkaria päällekkäin. Miten lie se tilataan? Laitoin nyt kaksi jalkaa jos tämä pinoteline ei onnistu.\n\niFFALCON telkkareita jos ei tärkeämpää tarvetta ole, mutta info-tv:t passaa myös.
54	Kimmo	Tuulian laputuspiste	Nosto-oven lähelle	2026-05-28 07:00:04.328348	2026-06-07 00:00:00	placed	\N	2026-05-28 07:00:04.328348	2026-05-28 07:00:04.328348	3	{"power": "Tulostin ja tietokone. Toiminta valmis asap."}	Työpiste kasauksen ajaksi id taputusta varten. Tapahtumaksi puretaan pois. Vaatimus, tukeva pöytä
55	Kimmo	Pro extrarivi	Pro rivi	2026-05-28 17:32:45.70741	2026-06-07 00:00:00	placed	\N	2026-05-28 17:32:45.70741	2026-05-28 17:32:45.70741	3	{"power": "22 konepaikkaa", "network": "22 koneelle"}	BUILD! 5 pöytää/ puoli, samalla tavalla kuin normi pro rivi
51	Health	Game/Live	Greenroom (ent striimi louge) Striimikornerin kyljessä	2026-05-24 21:58:22.805566	2026-06-07 00:00:00	placed	\N	2026-05-24 21:58:22.805566	2026-05-30 12:30:02.637538	3	{"tv": "Greenroomiin (ent striimilounge) Striimikornerin kyljessä. Vois periaatteessa olla myös info-tv (ja ei oo pakko olla pöytäjalka), mut saatetaan yhdistää siihen joku konsoli tms.", "power": "Tarpeeksi sähköä jonkunlaiselle jääkaapille (alustavasti pienelle), tv:lle, ja jokuselle kännykän tms latauspaikalle. Voidaan hakea jatkojohdot myös itse.", "lighting": "Ainakin pari washia tjsp tuomaan vähän valoa ja tunnelmaa. Jos jaksatte niin jotakin kivaa koristetta esim valoputkia pari kipaletta johonki verhoon <3"}	-Nättejä sohvia, tilassa käy myös striimaajia ja esiintyjiä. Vaikka ne mustat nahkaset mitä ennenki ollu.\n\n-Jääkaappi voi olla myös joku muu, säilötään joitakin juomia ja eväitä. (mitä nätimpi sen parempi) \n\n-Layout ehdotuksen näkee pohjakartan striimikorneri-välilehdeltä, jos tarvitsee, mutta säädetään sen mukaan miten tarvii.\n\n\n-PLUS SE RUSKEE MATALA SOHVAPÖYTÄ (puuttuu)
56	Kimmo	Premium 2E - 5konepaikkaa	Premium 2E	2026-05-28 17:36:26.096835	2026-06-07 00:00:00	placed	\N	2026-05-28 17:36:26.096835	2026-05-29 06:51:59.914397	3	{"tv": "Premiumloossin tv", "power": "5 koneelle + tv", "network": "Premium loossi, 5 konetta"}	3E paikka.
50	Health	Rounds.gg+Insinööriliitto	Rounds ja Insinööriliitto piste Pärinällä	2026-05-24 21:42:29.188256	2026-06-07 00:00:00	placed	\N	2026-05-24 21:42:29.188256	2026-05-28 18:41:38.572109	3	{"power": "Riittävästi sähköä yhdelle pienelle arkkupakastimelle sekä ainakin 2 konepaikalle, läppärille ja mahd heidän omille valoille", "network": "2-3 koneelle langallista"}	Rounds ja Insinööriliitto on samalla pisteellä.\n\nEdit: Matottavat itse.
58	naanatin	HR	Kävijöiden hiljainen tila	2026-06-04 00:00:00	2026-06-07 23:59:59	placed	\N	2026-05-29 07:40:20.203786	2026-05-29 07:40:20.203786	3	{"lighting": "punainen wash"}	\N
59	naanatin	HR	Orgien hiljainen tila	2026-06-04 00:00:00	2026-06-07 23:59:59	placed	\N	2026-05-29 07:41:03.086556	2026-05-29 07:41:03.086556	3	{"lighting": "jouluvaloja"}	\N
60	mamahjo	Info	Infoon viedään ite	2026-06-01 00:00:00	2026-06-07 23:59:59	placed	\N	2026-06-02 11:31:32.889863	2026-06-02 11:31:32.889863	3	\N	\N
44	Health	Game	Striimikorneri JA Turnausstriimikarsinat	2026-05-24 21:01:34.941183	2026-06-07 00:00:00	placed	\N	2026-05-24 21:01:34.941183	2026-06-02 12:04:44.833144	3	{"tv": "Tv:t striimaajien taakse trusseihin, voi laittaa samanlaista ku aiemminki", "power": "Striimikorneriin JA kolmeen turnaustriimialueen \\"karsinaan\\" sähköt (voi ottaa samasta tai miten ikinä rakennattekaan):\\n\\nStriimikornerissa 3 konepaikkaa (näyttöineen, muine oheislaitteineen jne) + 3x tv:t ja decon valot, ynnä muut jutut.\\n\\nTurnausstriimialueella n. 10-12 konetta, näyttöjä, valoja, sun muita oheislaitteita.", "network": "1 langallinen verkko Striimikorneriin 3 konepaikalle. Toinen verkko Turnausstriimien puolelle, joka karsinaan vähintään kolmelle koneelle paikat (saattaa tarvita useammankin). Turnausstriimien netin voi ottaa Striimikornerin puolelta ja vice versa. Voidaan hakee itekki verkkokaapeleita.\\nEn tarvii wifiä.", "lighting": "Jotain hauskaa ja kivaa striimaajien taustalle, esim valoputkia. Ja selostajien taustalle Turnausstriimikarsinoihin jos jaksatte <3"}	Yhdistin nämä nyt samaan, ovat vierekkäi kuiteski :)\n\n3x muovipöytää Striimikorneriin, muut pöydät on Turnausstriimien puolelle.\nVaneripöydät voi olla muutakin suurinpiirtein samankokoista pöytää kuin mitä on tilattu.\n\nSellainen sohva, että se kestää olla striimaajien taustalla/kamerassa, eli nätti. Voidaan tarvittaessa myös kantaa esim. greenroomista siksiaikaa on tarve.\n\nedit: kasauksen aikana sovittiin tänne vielä plus yksi konepaikka striimaaja-kävijä matseja varten.
61	Kimmo	Osao	Osaon piste	2026-06-01 00:00:00	2026-06-07 23:59:59	placed	\N	2026-06-03 07:47:13.177529	2026-06-03 07:47:13.177529	3	\N	\N
62	Cappe	Sähkö	Omatoiminen nouto	2026-06-01 00:00:00	2026-06-07 23:59:59	placed	\N	2026-06-03 08:27:39.850194	2026-06-03 08:27:39.850194	3	\N	Haettiin jo omatoimisesti
63	Jarkko Laava	Turvallisuus	Org alue	2026-06-03 00:00:00	2026-06-07 23:59:59	placed	\N	2026-06-03 11:09:02.707328	2026-06-03 11:09:02.707328	3	\N	\N
64	Melli Hautala	Ensiapu	EA konepaikat	2026-06-03 00:00:00	2026-06-07 23:59:59	placed	\N	2026-06-03 12:23:20.165398	2026-06-03 12:23:20.165398	3	\N	Yami
65	Halla	Hr	Nakkikioski	2026-06-01 00:00:00	2026-06-07 23:59:59	placed	\N	2026-06-03 12:30:48.068484	2026-06-03 12:30:48.068484	3	\N	\N
66	Saxon Wars	Game	Non-Byoc	2026-06-06 00:00:00	2026-06-07 23:59:59	placed	\N	2026-06-06 11:27:44.84958	2026-06-06 14:47:00.159732	3	\N	tilaus peruttu
\.


--
-- Data for Name: stock_audit; Type: TABLE DATA; Schema: public; Owner: infrashop
--

COPY public.stock_audit (id, item_id, order_id, delta, reason, actor, created_at) FROM stdin;
4	63	3	-1	Order 3 created	Joni Tähtinen (Jstari)	2026-04-02 16:03:44.38103
5	40	4	-1	Group 4 (order 4)	Live	2026-04-02 16:11:22.769743
6	55	4	-3	Group 4 (order 4)	Live	2026-04-02 16:11:22.769743
7	8	4	-1	Group 4 (order 4)	Live	2026-04-02 16:11:22.769743
8	17	4	-4	Group 4 (order 4)	Live	2026-04-02 16:11:22.769743
9	11	5	-7	Order 5 created	Ilpo Alatalo	2026-04-02 19:33:17.536709
10	12	5	-1	Order 5 created	Ilpo Alatalo	2026-04-02 19:33:17.536709
11	13	5	-10	Order 5 created	Ilpo Alatalo	2026-04-02 19:33:17.536709
12	15	5	-2	Order 5 created	Ilpo Alatalo	2026-04-02 19:33:17.536709
13	16	5	-1	Order 5 created	Ilpo Alatalo	2026-04-02 19:33:17.536709
14	17	5	-2	Order 5 created	Ilpo Alatalo	2026-04-02 19:33:17.536709
15	25	5	-2	Order 5 created	Ilpo Alatalo	2026-04-02 19:33:17.536709
16	41	5	-7	Order 5 created	Ilpo Alatalo	2026-04-02 19:33:17.536709
17	44	5	-1	Order 5 created	Ilpo Alatalo	2026-04-02 19:33:17.536709
18	46	5	-1	Order 5 created	Ilpo Alatalo	2026-04-02 19:33:17.536709
19	51	5	-1	Order 5 created	Ilpo Alatalo	2026-04-02 19:33:17.536709
20	52	5	-1	Order 5 created	Ilpo Alatalo	2026-04-02 19:33:17.536709
21	12	5	-6	Order 5 update	2	2026-04-06 17:51:53.256577
22	13	6	-20	Order 6 created	Ilta Pirttilahti	2026-04-09 10:59:34.26959
23	60	6	-1	Order 6 created	Ilta Pirttilahti	2026-04-09 10:59:34.26959
24	93	6	-1	Order 6 created	Ilta Pirttilahti	2026-04-09 10:59:34.26959
25	102	6	-3	Order 6 created	Ilta Pirttilahti	2026-04-09 10:59:34.26959
26	15	6	-10	Group 6 (order 6)	Ilta Pirttilahti	2026-04-09 10:59:34.26959
27	55	7	-96	Order 7 created	Kimmo	2026-04-15 20:11:55.344915
28	13	7	-216	Order 7 update	Kimmo	2026-04-15 20:29:20.339572
29	34	6	-1	Order 6 update	Ilta Pirttilahti	2026-04-15 20:30:07.893099
30	12	8	-144	Order 8 created	Kimmo	2026-04-15 20:54:21.275889
31	13	8	-144	Order 8 created	Kimmo	2026-04-15 20:54:21.275889
32	25	8	-24	Order 8 created	Kimmo	2026-04-15 20:54:21.275889
33	34	8	-8	Order 8 created	Kimmo	2026-04-15 20:54:21.275889
34	48	8	-4	Order 8 created	Kimmo	2026-04-15 20:54:21.275889
35	50	8	-16	Order 8 created	Kimmo	2026-04-15 20:54:21.275889
36	11	9	-4	Order 9 created	Ilpo Alatalo	2026-04-30 18:02:36.919016
37	12	9	-2	Order 9 created	Ilpo Alatalo	2026-04-30 18:02:36.919016
38	13	9	-20	Order 9 created	Ilpo Alatalo	2026-04-30 18:02:36.919016
39	15	9	-1	Order 9 created	Ilpo Alatalo	2026-04-30 18:02:36.919016
40	16	9	-7	Order 9 created	Ilpo Alatalo	2026-04-30 18:02:36.919016
41	17	9	-5	Order 9 created	Ilpo Alatalo	2026-04-30 18:02:36.919016
42	25	9	-9	Order 9 created	Ilpo Alatalo	2026-04-30 18:02:36.919016
43	40	9	-1	Order 9 created	Ilpo Alatalo	2026-04-30 18:02:36.919016
44	42	9	-5	Order 9 created	Ilpo Alatalo	2026-04-30 18:02:36.919016
45	44	9	-2	Order 9 created	Ilpo Alatalo	2026-04-30 18:02:36.919016
46	46	9	-2	Order 9 created	Ilpo Alatalo	2026-04-30 18:02:36.919016
47	55	4	-7	Order 4 update	Live	2026-05-08 13:54:05.072944
48	12	10	-11	Order 10 created	Kimmo	2026-05-09 08:18:16.784342
49	13	10	-11	Order 10 created	Kimmo	2026-05-09 08:18:16.784342
50	34	10	-5	Order 10 created	Kimmo	2026-05-09 08:18:16.784342
51	48	10	-1	Order 10 created	Kimmo	2026-05-09 08:18:16.784342
52	13	11	-8	Order 11 created	Kimmo	2026-05-09 08:21:08.650754
53	34	11	-8	Order 11 created	Kimmo	2026-05-09 08:21:08.650754
54	48	11	-1	Order 11 created	Kimmo	2026-05-09 08:21:08.650754
55	12	12	-23	Order 12 created	Kimmo	2026-05-10 18:22:30.118016
56	34	12	-2	Order 12 created	Kimmo	2026-05-10 18:22:30.118016
57	48	12	-1	Order 12 created	Kimmo	2026-05-10 18:22:30.118016
58	55	12	-7	Order 12 created	Kimmo	2026-05-10 18:22:30.118016
59	63	12	-3	Order 12 created	Kimmo	2026-05-10 18:22:30.118016
60	12	13	-14	Order 13 created	Kimmo	2026-05-10 18:32:35.671552
61	13	13	-14	Order 13 created	Kimmo	2026-05-10 18:32:35.671552
62	52	13	-2	Order 13 created	Kimmo	2026-05-10 18:32:35.671552
63	55	13	-2	Order 13 created	Kimmo	2026-05-10 18:32:35.671552
64	63	13	-5	Order 13 created	Kimmo	2026-05-10 18:32:35.671552
65	34	13	-2	Order 13 update	Kimmo	2026-05-10 18:33:17.548096
66	34	10	1	Order 10 update	Kimmo	2026-05-11 06:37:15.205218
70	12	15	-10	Order 15 created	Kimmo	2026-05-11 07:01:59.713004
71	25	15	-5	Order 15 created	Kimmo	2026-05-11 07:01:59.713004
72	34	15	-2	Order 15 created	Kimmo	2026-05-11 07:01:59.713004
73	83	15	-10	Group 3 (order 15)	Kimmo	2026-05-11 07:01:59.713004
74	48	15	-1	Group 3 (order 15)	Kimmo	2026-05-11 07:01:59.713004
75	25	16	-30	Order 16 created	Kimmo	2026-05-11 07:04:04.138911
76	60	16	-1	Order 16 created	Kimmo	2026-05-11 07:04:04.138911
77	63	16	-1	Order 16 created	Kimmo	2026-05-11 07:04:04.138911
78	100	16	-23	Order 16 created	Kimmo	2026-05-11 07:04:04.138911
79	50	17	-1	Order 17 created	Kimmo	2026-05-11 11:33:17.413367
80	52	17	-1	Order 17 created	Kimmo	2026-05-11 11:33:17.413367
81	92	17	-2	Order 17 created	Kimmo	2026-05-11 11:33:17.413367
82	93	17	-2	Order 17 created	Kimmo	2026-05-11 11:33:17.413367
83	104	17	-2	Order 17 created	Kimmo	2026-05-11 11:33:17.413367
84	13	16	-150	Order 16 update	Kimmo	2026-05-11 11:36:40.3362
85	16	12	-6	Order 12 update	Kimmo	2026-05-12 15:53:14.570839
86	46	12	-2	Order 12 update	Kimmo	2026-05-12 15:53:14.570839
87	44	12	-2	Order 12 update	Kimmo	2026-05-12 15:53:14.570839
88	16	13	-2	Order 13 update	Kimmo	2026-05-12 15:53:54.31407
89	44	13	-2	Order 13 update	Kimmo	2026-05-12 15:53:54.31407
90	46	13	-2	Order 13 update	Kimmo	2026-05-12 15:53:54.31407
91	16	18	-3	Order 18 created	Kimmo	2026-05-14 16:10:27.106182
92	17	18	-3	Order 18 created	Kimmo	2026-05-14 16:10:27.106182
93	41	18	-1	Order 18 created	Kimmo	2026-05-14 16:10:27.106182
94	11	19	-10	Order 19 created	Ilpo Alatalo	2026-05-14 16:19:04.936965
95	12	19	-5	Order 19 created	Ilpo Alatalo	2026-05-14 16:19:04.936965
96	13	19	-7	Order 19 created	Ilpo Alatalo	2026-05-14 16:19:04.936965
97	15	19	-1	Order 19 created	Ilpo Alatalo	2026-05-14 16:19:04.936965
98	17	19	-1	Order 19 created	Ilpo Alatalo	2026-05-14 16:19:04.936965
99	18	19	-5	Order 19 created	Ilpo Alatalo	2026-05-14 16:19:04.936965
100	25	19	-2	Order 19 created	Ilpo Alatalo	2026-05-14 16:19:04.936965
101	31	19	-5	Order 19 created	Ilpo Alatalo	2026-05-14 16:19:04.936965
102	41	19	-5	Order 19 created	Ilpo Alatalo	2026-05-14 16:19:04.936965
103	42	19	-1	Order 19 created	Ilpo Alatalo	2026-05-14 16:19:04.936965
104	44	19	-1	Order 19 created	Ilpo Alatalo	2026-05-14 16:19:04.936965
105	46	19	-1	Order 19 created	Ilpo Alatalo	2026-05-14 16:19:04.936965
106	64	19	-1	Order 19 created	Ilpo Alatalo	2026-05-14 16:19:04.936965
107	84	19	-1	Order 19 created	Ilpo Alatalo	2026-05-14 16:19:04.936965
108	11	20	-4	Order 20 created	Ilpo Alatalo	2026-05-14 16:28:45.825814
109	12	20	-2	Order 20 created	Ilpo Alatalo	2026-05-14 16:28:45.825814
110	13	20	-2	Order 20 created	Ilpo Alatalo	2026-05-14 16:28:45.825814
111	17	20	-1	Order 20 created	Ilpo Alatalo	2026-05-14 16:28:45.825814
112	28	20	-1	Order 20 created	Ilpo Alatalo	2026-05-14 16:28:45.825814
113	42	20	-1	Order 20 created	Ilpo Alatalo	2026-05-14 16:28:45.825814
114	64	20	-1	Order 20 created	Ilpo Alatalo	2026-05-14 16:28:45.825814
115	9	21	-3	Order 21 created	Ilpo Alatalo	2026-05-14 16:38:01.958539
116	11	21	-2	Order 21 created	Ilpo Alatalo	2026-05-14 16:38:01.958539
117	12	21	-1	Order 21 created	Ilpo Alatalo	2026-05-14 16:38:01.958539
118	13	21	-2	Order 21 created	Ilpo Alatalo	2026-05-14 16:38:01.958539
119	15	21	-1	Order 21 created	Ilpo Alatalo	2026-05-14 16:38:01.958539
120	50	21	-2	Order 21 created	Ilpo Alatalo	2026-05-14 16:38:01.958539
121	64	21	-1	Order 21 created	Ilpo Alatalo	2026-05-14 16:38:01.958539
122	13	22	-12	Order 22 created	Ilpo Alatalo	2026-05-14 16:47:06.455736
123	50	22	-5	Order 22 created	Ilpo Alatalo	2026-05-14 16:47:06.455736
124	61	22	-2	Order 22 created	Ilpo Alatalo	2026-05-14 16:47:06.455736
125	64	22	-1	Order 22 created	Ilpo Alatalo	2026-05-14 16:47:06.455736
126	11	23	-12	Order 23 created	Ilpo Alatalo	2026-05-14 17:55:47.105356
127	12	23	-6	Order 23 created	Ilpo Alatalo	2026-05-14 17:55:47.105356
128	13	23	-6	Order 23 created	Ilpo Alatalo	2026-05-14 17:55:47.105356
129	25	23	-3	Order 23 created	Ilpo Alatalo	2026-05-14 17:55:47.105356
130	64	23	-1	Order 23 created	Ilpo Alatalo	2026-05-14 17:55:47.105356
131	11	24	-5	Order 24 created	Halla	2026-05-15 06:21:26.117635
132	61	24	-2	Group 8 (order 24)	Halla	2026-05-15 06:21:26.117635
133	48	24	-1	Group 8 (order 24)	Halla	2026-05-15 06:21:26.117635
134	12	24	-5	Group 8 (order 24)	Halla	2026-05-15 06:21:26.117635
135	112	24	-1	Group 8 (order 24)	Halla	2026-05-15 06:21:26.117635
136	64	24	-1	Group 8 (order 24)	Halla	2026-05-15 06:21:26.117635
137	13	24	-5	Group 8 (order 24)	Halla	2026-05-15 06:21:26.117635
138	50	24	-3	Group 8 (order 24)	Halla	2026-05-15 06:21:26.117635
139	9	24	-6	Group 9 (order 24)	Halla	2026-05-15 06:21:26.117635
140	85	24	-2	Group 9 (order 24)	Halla	2026-05-15 06:21:26.117635
141	13	22	-8	Order 22 update	Ilpo Alatalo	2026-05-17 10:39:49.896965
142	50	22	-2	Order 22 update	Ilpo Alatalo	2026-05-17 10:39:49.896965
143	9	22	-2	Order 22 update	Ilpo Alatalo	2026-05-17 10:39:49.896965
144	9	25	-1	Order 25 created	Ilpo Alatalo	2026-05-17 10:47:43.576848
145	13	25	-6	Order 25 created	Ilpo Alatalo	2026-05-17 10:47:43.576848
146	50	25	-1	Order 25 created	Ilpo Alatalo	2026-05-17 10:47:43.576848
147	52	25	-1	Order 25 created	Ilpo Alatalo	2026-05-17 10:47:43.576848
148	34	26	-2	Order 26 created	naanatin	2026-05-18 05:42:48.399719
149	13	26	-3	Order 26 update	naanatin	2026-05-18 05:45:48.745409
150	17	26	-1	Order 26 update	naanatin	2026-05-18 05:45:48.745409
151	16	26	-1	Order 26 update	naanatin	2026-05-18 05:45:48.745409
152	47	26	-1	Order 26 update	naanatin	2026-05-18 05:45:48.745409
153	52	26	-1	Order 26 update	naanatin	2026-05-18 05:45:48.745409
154	12	26	-2	Order 26 update	naanatin	2026-05-18 05:45:48.745409
155	11	26	-2	Order 26 update	naanatin	2026-05-18 05:45:48.745409
156	7	26	-16	Order 26 update	naanatin	2026-05-18 05:45:48.745409
157	56	26	-1	Order 26 update	naanatin	2026-05-18 05:45:48.745409
158	9	26	-1	Order 26 update	naanatin	2026-05-18 05:45:48.745409
159	7	27	-24	Order 27 created	naanatin	2026-05-18 05:51:21.811086
160	11	27	-6	Order 27 created	naanatin	2026-05-18 05:51:21.811086
161	12	27	-3	Order 27 created	naanatin	2026-05-18 05:51:21.811086
162	13	27	-6	Order 27 created	naanatin	2026-05-18 05:51:21.811086
163	15	27	-3	Order 27 created	naanatin	2026-05-18 05:51:21.811086
164	16	27	-1	Order 27 created	naanatin	2026-05-18 05:51:21.811086
165	17	27	-1	Order 27 created	naanatin	2026-05-18 05:51:21.811086
166	34	27	-2	Order 27 created	naanatin	2026-05-18 05:51:21.811086
167	47	27	-1	Order 27 created	naanatin	2026-05-18 05:51:21.811086
168	57	27	-1	Order 27 created	naanatin	2026-05-18 05:51:21.811086
169	60	27	-1	Order 27 created	naanatin	2026-05-18 05:51:21.811086
170	61	27	-3	Order 27 created	naanatin	2026-05-18 05:51:21.811086
171	60	28	-1	Order 28 created	naanatin	2026-05-18 05:52:32.033602
172	11	29	-4	Order 29 created	naanatin	2026-05-18 05:54:54.252943
173	12	29	-2	Order 29 created	naanatin	2026-05-18 05:54:54.252943
174	52	30	-1	Order 30 created	naanatin	2026-05-18 05:57:45.087244
175	9	31	-1	Order 31 created	naanatin	2026-05-18 06:04:11.547001
176	11	31	-2	Order 31 created	naanatin	2026-05-18 06:04:11.547001
177	12	31	-1	Order 31 created	naanatin	2026-05-18 06:04:11.547001
178	13	31	-3	Order 31 created	naanatin	2026-05-18 06:04:11.547001
179	24	31	-1	Order 31 created	naanatin	2026-05-18 06:04:11.547001
180	41	31	-1	Order 31 created	naanatin	2026-05-18 06:04:11.547001
181	48	31	-1	Order 31 created	naanatin	2026-05-18 06:04:11.547001
182	55	31	-4	Order 31 created	naanatin	2026-05-18 06:04:11.547001
183	86	31	-1	Order 31 created	naanatin	2026-05-18 06:04:11.547001
184	87	31	-1	Order 31 created	naanatin	2026-05-18 06:04:11.547001
185	112	31	-2	Order 31 created	naanatin	2026-05-18 06:04:11.547001
186	101	9	-4	Order 9 update	Ilpo Alatalo	2026-05-18 06:09:08.085382
187	9	32	-1	Order 32 created	naanatin	2026-05-18 06:14:00.216176
188	101	32	-7	Order 32 created	naanatin	2026-05-18 06:14:00.216176
189	21	18	-8	Order 18 update	Kimmo	2026-05-19 18:25:55.752001
190	91	31	-1	Order 31 update	naanatin	2026-05-21 16:18:31.173963
191	93	31	-1	Order 31 update	naanatin	2026-05-21 16:21:48.586001
192	81	31	-1	Order 31 update	naanatin	2026-05-21 16:22:39.812457
193	24	31	1	Order 31 update	naanatin	2026-05-21 16:36:09.463405
194	17	31	-1	Order 31 update	naanatin	2026-05-21 16:36:09.463405
195	42	31	-1	Order 31 update	naanatin	2026-05-21 16:36:09.463405
196	16	31	-1	Order 31 update	naanatin	2026-05-21 16:36:09.463405
197	13	33	-2	Order 33 created	Health	2026-05-23 12:38:39.182098
198	15	33	-1	Order 33 created	Health	2026-05-23 12:38:39.182098
199	16	33	-1	Order 33 created	Health	2026-05-23 12:38:39.182098
200	17	33	-1	Order 33 created	Health	2026-05-23 12:38:39.182098
201	18	33	-1	Order 33 created	Health	2026-05-23 12:38:39.182098
202	41	33	-1	Order 33 created	Health	2026-05-23 12:38:39.182098
203	42	33	-1	Order 33 created	Health	2026-05-23 12:38:39.182098
204	11	34	-2	Order 34 created	Health	2026-05-23 13:04:20.365729
205	12	34	-1	Order 34 created	Health	2026-05-23 13:04:20.365729
206	13	34	-5	Order 34 created	Health	2026-05-23 13:04:20.365729
207	34	34	-2	Order 34 created	Health	2026-05-23 13:04:20.365729
208	52	34	-1	Order 34 created	Health	2026-05-23 13:04:20.365729
209	110	34	-2	Order 34 created	Health	2026-05-23 13:04:20.365729
210	9	35	-1	Order 35 created	Health	2026-05-23 13:22:28.241601
211	11	35	-2	Order 35 created	Health	2026-05-23 13:22:28.241601
212	12	35	-1	Order 35 created	Health	2026-05-23 13:22:28.241601
213	13	35	-46	Order 35 created	Health	2026-05-23 13:22:28.241601
214	15	35	-11	Order 35 created	Health	2026-05-23 13:22:28.241601
215	52	35	-1	Order 35 created	Health	2026-05-23 13:22:28.241601
216	109	35	-6	Order 35 created	Health	2026-05-23 13:22:28.241601
217	112	35	-11	Order 35 created	Health	2026-05-23 13:22:28.241601
218	9	36	-1	Order 36 created	Health	2026-05-23 13:50:27.538225
219	11	36	-2	Order 36 created	Health	2026-05-23 13:50:27.538225
220	12	36	-1	Order 36 created	Health	2026-05-23 13:50:27.538225
221	16	36	-1	Order 36 created	Health	2026-05-23 13:50:27.538225
222	17	36	-1	Order 36 created	Health	2026-05-23 13:50:27.538225
223	42	36	-1	Order 36 created	Health	2026-05-23 13:50:27.538225
224	48	36	-1	Order 36 created	Health	2026-05-23 13:50:27.538225
225	50	36	-5	Order 36 created	Health	2026-05-23 13:50:27.538225
226	16	37	-1	Order 37 created	Health	2026-05-23 15:17:20.066699
227	17	37	-1	Order 37 created	Health	2026-05-23 15:17:20.066699
228	42	37	-1	Order 37 created	Health	2026-05-23 15:17:20.066699
229	9	38	-3	Order 38 created	Ilpo Alatalo	2026-05-24 10:13:59.548236
230	11	38	-2	Order 38 created	Ilpo Alatalo	2026-05-24 10:13:59.548236
231	12	38	-1	Order 38 created	Ilpo Alatalo	2026-05-24 10:13:59.548236
232	13	38	-4	Order 38 created	Ilpo Alatalo	2026-05-24 10:13:59.548236
233	25	38	-5	Order 38 created	Ilpo Alatalo	2026-05-24 10:13:59.548236
234	52	38	-1	Order 38 created	Ilpo Alatalo	2026-05-24 10:13:59.548236
235	112	38	-1	Order 38 created	Ilpo Alatalo	2026-05-24 10:13:59.548236
236	40	39	-1	Order 39 created	Sähkö / PikkuPanda	2026-05-24 10:52:46.293496
237	110	39	-6	Order 39 created	Sähkö / PikkuPanda	2026-05-24 10:52:46.293496
238	9	40	-2	Order 40 created	Kimmo	2026-05-24 10:59:03.078735
239	13	40	-4	Order 40 created	Kimmo	2026-05-24 10:59:03.078735
240	50	40	-10	Order 40 created	Kimmo	2026-05-24 10:59:03.078735
241	60	40	-1	Order 40 created	Kimmo	2026-05-24 10:59:03.078735
242	80	40	-1	Order 40 created	Kimmo	2026-05-24 10:59:03.078735
243	90	40	-1	Order 40 created	Kimmo	2026-05-24 10:59:03.078735
244	116	40	-4	Order 40 created	Kimmo	2026-05-24 10:59:03.078735
245	60	40	1	Order 40 update	4	2026-05-24 10:59:49.504897
246	116	40	4	Order 40 update	4	2026-05-24 10:59:49.504897
247	63	16	-1	Order 16 update	4	2026-05-24 11:00:33.872652
248	11	41	-2	Order 41 created	Health	2026-05-24 18:28:20.844841
249	12	41	-1	Order 41 created	Health	2026-05-24 18:28:20.844841
250	110	41	-1	Order 41 created	Health	2026-05-24 18:28:20.844841
251	118	41	-1	Order 41 created	Health	2026-05-24 18:28:20.844841
252	11	36	-8	Order 36 update	Health	2026-05-24 18:28:52.692702
253	7	42	-16	Order 42 created	Health	2026-05-24 18:55:46.518558
254	9	42	-1	Order 42 created	Health	2026-05-24 18:55:46.518558
255	13	42	-4	Order 42 created	Health	2026-05-24 18:55:46.518558
256	16	42	-1	Order 42 created	Health	2026-05-24 18:55:46.518558
257	17	42	-1	Order 42 created	Health	2026-05-24 18:55:46.518558
258	41	42	-1	Order 42 created	Health	2026-05-24 18:55:46.518558
259	42	42	-1	Order 42 created	Health	2026-05-24 18:55:46.518558
260	56	42	-1	Order 42 created	Health	2026-05-24 18:55:46.518558
261	109	42	-2	Order 42 created	Health	2026-05-24 18:55:46.518558
262	11	34	-3	Order 34 update	Health	2026-05-24 19:15:16.171271
263	52	34	1	Order 34 update	Health	2026-05-24 19:15:16.171271
264	13	43	-10	Order 43 created	Health	2026-05-24 20:02:21.896812
265	27	43	-10	Order 43 created	Health	2026-05-24 20:02:21.896812
266	39	43	-10	Order 43 created	Health	2026-05-24 20:02:21.896812
267	40	43	-1	Order 43 created	Health	2026-05-24 20:02:21.896812
268	63	43	-4	Order 43 created	Health	2026-05-24 20:02:21.896812
269	117	43	-4	Order 43 created	Health	2026-05-24 20:02:21.896812
270	9	44	-1	Order 44 created	Health	2026-05-24 21:01:34.941183
271	11	44	-4	Order 44 created	Health	2026-05-24 21:01:34.941183
272	12	44	-2	Order 44 created	Health	2026-05-24 21:01:34.941183
273	15	44	-6	Order 44 created	Health	2026-05-24 21:01:34.941183
274	16	44	-3	Order 44 created	Health	2026-05-24 21:01:34.941183
275	17	44	-3	Order 44 created	Health	2026-05-24 21:01:34.941183
276	21	44	-14	Order 44 created	Health	2026-05-24 21:01:34.941183
277	27	44	-11	Order 44 created	Health	2026-05-24 21:01:34.941183
278	31	44	-7	Order 44 created	Health	2026-05-24 21:01:34.941183
279	32	44	-7	Order 44 created	Health	2026-05-24 21:01:34.941183
280	37	44	-7	Order 44 created	Health	2026-05-24 21:01:34.941183
281	38	44	-7	Order 44 created	Health	2026-05-24 21:01:34.941183
282	39	44	-4	Order 44 created	Health	2026-05-24 21:01:34.941183
283	47	44	-3	Order 44 created	Health	2026-05-24 21:01:34.941183
284	50	44	-5	Order 44 created	Health	2026-05-24 21:01:34.941183
285	60	44	-1	Order 44 created	Health	2026-05-24 21:01:34.941183
286	63	44	-1	Order 44 created	Health	2026-05-24 21:01:34.941183
287	84	44	-1	Order 44 created	Health	2026-05-24 21:01:34.941183
288	101	44	-6	Order 44 created	Health	2026-05-24 21:01:34.941183
289	115	44	-12	Order 44 created	Health	2026-05-24 21:01:34.941183
290	11	45	-2	Order 45 created	Health	2026-05-24 21:10:22.674712
291	12	45	-1	Order 45 created	Health	2026-05-24 21:10:22.674712
292	13	45	-40	Order 45 created	Health	2026-05-24 21:10:22.674712
293	34	45	-4	Order 45 created	Health	2026-05-24 21:10:22.674712
294	52	45	-1	Order 45 created	Health	2026-05-24 21:10:22.674712
295	117	45	-4	Order 45 created	Health	2026-05-24 21:10:22.674712
296	11	46	-2	Order 46 created	Health	2026-05-24 21:21:49.697128
297	12	46	-1	Order 46 created	Health	2026-05-24 21:21:49.697128
298	13	46	-20	Order 46 created	Health	2026-05-24 21:21:49.697128
299	15	46	-2	Order 46 created	Health	2026-05-24 21:21:49.697128
300	16	46	-1	Order 46 created	Health	2026-05-24 21:21:49.697128
301	17	46	-1	Order 46 created	Health	2026-05-24 21:21:49.697128
302	21	46	-2	Order 46 created	Health	2026-05-24 21:21:49.697128
303	25	46	-3	Order 46 created	Health	2026-05-24 21:21:49.697128
304	42	46	-1	Order 46 created	Health	2026-05-24 21:21:49.697128
305	48	46	-1	Order 46 created	Health	2026-05-24 21:21:49.697128
306	107	46	-1	Order 46 created	Health	2026-05-24 21:21:49.697128
307	110	46	-1	Order 46 created	Health	2026-05-24 21:21:49.697128
308	11	47	-2	Order 47 created	Health	2026-05-24 21:25:19.055954
309	12	47	-1	Order 47 created	Health	2026-05-24 21:25:19.055954
310	13	47	-4	Order 47 created	Health	2026-05-24 21:25:19.055954
311	15	47	-2	Order 47 created	Health	2026-05-24 21:25:19.055954
312	109	47	-2	Order 47 created	Health	2026-05-24 21:25:19.055954
313	7	48	-16	Order 48 created	Health	2026-05-24 21:32:00.77224
314	9	48	-1	Order 48 created	Health	2026-05-24 21:32:00.77224
315	11	48	-2	Order 48 created	Health	2026-05-24 21:32:00.77224
316	12	48	-1	Order 48 created	Health	2026-05-24 21:32:00.77224
317	13	48	-2	Order 48 created	Health	2026-05-24 21:32:00.77224
318	40	48	-1	Order 48 created	Health	2026-05-24 21:32:00.77224
319	50	48	-2	Order 48 created	Health	2026-05-24 21:32:00.77224
320	56	48	-1	Order 48 created	Health	2026-05-24 21:32:00.77224
321	109	48	-3	Order 48 created	Health	2026-05-24 21:32:00.77224
322	13	49	-2	Order 49 created	Health	2026-05-24 21:35:17.788484
323	15	49	-2	Order 49 created	Health	2026-05-24 21:35:17.788484
324	40	49	-1	Order 49 created	Health	2026-05-24 21:35:17.788484
325	11	50	-2	Order 50 created	Health	2026-05-24 21:42:29.188256
326	12	50	-1	Order 50 created	Health	2026-05-24 21:42:29.188256
327	13	50	-3	Order 50 created	Health	2026-05-24 21:42:29.188256
328	15	50	-1	Order 50 created	Health	2026-05-24 21:42:29.188256
329	56	50	-1	Order 50 created	Health	2026-05-24 21:42:29.188256
330	60	50	-1	Order 50 created	Health	2026-05-24 21:42:29.188256
331	109	50	-4	Order 50 created	Health	2026-05-24 21:42:29.188256
332	9	51	-1	Order 51 created	Health	2026-05-24 21:58:22.805566
333	13	51	-2	Order 51 created	Health	2026-05-24 21:58:22.805566
334	15	51	-1	Order 51 created	Health	2026-05-24 21:58:22.805566
335	44	51	-1	Order 51 created	Health	2026-05-24 21:58:22.805566
336	46	51	-1	Order 51 created	Health	2026-05-24 21:58:22.805566
337	60	51	-1	Order 51 created	Health	2026-05-24 21:58:22.805566
338	84	51	-2	Order 51 created	Health	2026-05-24 21:58:22.805566
339	105	51	-1	Order 51 created	Health	2026-05-24 21:58:22.805566
340	109	51	-3	Order 51 created	Health	2026-05-24 21:58:22.805566
341	110	51	-1	Order 51 created	Health	2026-05-24 21:58:22.805566
342	11	50	-1	Order 50 update	Health	2026-05-24 21:58:57.561039
343	11	48	-1	Order 48 update	Health	2026-05-24 21:59:08.386371
344	11	45	-4	Order 45 update	Health	2026-05-24 22:00:11.336807
345	11	44	-5	Order 44 update	Health	2026-05-24 22:00:29.541318
346	114	43	-1	Order 43 update	Health	2026-05-24 22:01:05.077351
347	12	43	-1	Order 43 update	Health	2026-05-24 22:01:41.888274
348	11	43	-10	Order 43 update	Health	2026-05-24 22:01:41.888274
349	11	36	1	Order 36 update	Health	2026-05-24 22:02:43.889841
350	11	41	1	Order 41 update	Health	2026-05-24 22:10:57.430116
351	50	44	-1	Order 44 update	4	2026-05-25 13:28:15.905277
352	63	44	1	Order 44 update	4	2026-05-25 13:28:15.905277
353	63	16	-1	Order 16 update	4	2026-05-25 13:28:31.327073
354	113	52	-2	Order 52 created	Ville Alatalo	2026-05-25 18:32:37.248273
355	16	53	-2	Order 53 created	oherrala	2026-05-26 18:18:10.108213
356	42	53	-2	Order 53 created	oherrala	2026-05-26 18:18:10.108213
357	113	53	-2	Order 53 created	oherrala	2026-05-26 18:18:10.108213
358	13	27	-4	Order 27 update	naanatin	2026-05-27 13:37:00.642302
359	15	27	-2	Order 27 update	naanatin	2026-05-27 13:37:00.642302
360	63	43	4	Order 43 update	4	2026-05-27 16:59:22.322205
361	50	43	-4	Order 43 update	4	2026-05-27 16:59:22.322205
362	55	12	1	Order 12 update	4	2026-05-27 17:00:12.08263
363	63	12	-2	Order 12 update	4	2026-05-27 17:00:12.08263
364	34	54	-1	Order 54 created	Kimmo	2026-05-28 07:00:04.328348
365	52	54	-1	Order 54 created	Kimmo	2026-05-28 07:00:04.328348
366	116	54	-1	Order 54 created	Kimmo	2026-05-28 07:00:04.328348
367	12	55	-22	Order 55 created	Kimmo	2026-05-28 17:32:45.70741
368	13	55	-22	Order 55 created	Kimmo	2026-05-28 17:32:45.70741
369	34	55	-10	Order 55 created	Kimmo	2026-05-28 17:32:45.70741
370	48	55	-1	Order 55 created	Kimmo	2026-05-28 17:32:45.70741
371	12	56	-5	Order 56 created	Kimmo	2026-05-28 17:36:26.096835
372	13	56	-5	Order 56 created	Kimmo	2026-05-28 17:36:26.096835
373	16	56	-1	Order 56 created	Kimmo	2026-05-28 17:36:26.096835
374	34	56	-1	Order 56 created	Kimmo	2026-05-28 17:36:26.096835
375	44	56	-1	Order 56 created	Kimmo	2026-05-28 17:36:26.096835
376	46	56	-1	Order 56 created	Kimmo	2026-05-28 17:36:26.096835
377	52	56	-1	Order 56 created	Kimmo	2026-05-28 17:36:26.096835
378	55	56	-2	Order 56 created	Kimmo	2026-05-28 17:36:26.096835
379	25	8	24	Order 8 update	4	2026-05-28 17:41:16.412158
380	34	8	8	Order 8 update	4	2026-05-28 17:41:16.412158
381	50	8	16	Order 8 update	4	2026-05-28 17:41:16.412158
382	25	8	-18	Order 8 update	4	2026-05-28 17:43:36.131759
383	50	8	-10	Order 8 update	4	2026-05-28 17:43:36.131759
384	34	8	-6	Order 8 update	4	2026-05-28 17:43:36.131759
385	13	50	-2	Order 50 update	Health	2026-05-28 18:33:46.257018
386	7	50	-1	Order 50 update	Health	2026-05-28 18:41:38.572109
387	55	56	1	Order 56 update	4	2026-05-29 06:51:40.701501
388	55	56	-1	Order 56 update	4	2026-05-29 06:51:59.914397
392	9	\N	6	Order 57 deleted, stock returned	6	2026-05-29 07:39:49.014884
393	85	\N	2	Order 57 deleted, stock returned	6	2026-05-29 07:39:49.014884
394	109	\N	3	Order 57 deleted, stock returned	6	2026-05-29 07:39:49.014884
395	110	58	-1	Group 10 (order 58)	naanatin	2026-05-29 07:40:20.203786
396	85	58	-2	Group 10 (order 58)	naanatin	2026-05-29 07:40:20.203786
397	9	58	-1	Group 10 (order 58)	naanatin	2026-05-29 07:40:20.203786
398	9	59	-2	Group 9 (order 59)	naanatin	2026-05-29 07:41:03.086556
399	109	59	-3	Group 9 (order 59)	naanatin	2026-05-29 07:41:03.086556
400	122	59	-2	Group 9 (order 59)	naanatin	2026-05-29 07:41:03.086556
401	21	35	-2	Order 35 update	Health	2026-05-29 21:27:42.536418
402	21	44	10	Order 44 update	Health	2026-05-29 21:28:24.188601
403	21	44	-3	Order 44 update	Health	2026-05-29 21:28:55.861631
404	21	43	-10	Order 43 update	Health	2026-05-29 21:31:47.051021
405	25	9	-2	Order 9 update	Ilpo Alatalo	2026-05-29 22:28:21.98143
406	25	9	-1	Order 9 update	Ilpo Alatalo	2026-05-29 22:29:16.645574
407	13	9	-10	Order 9 update	Ilpo Alatalo	2026-05-30 12:15:44.837981
408	25	9	-4	Order 9 update	Ilpo Alatalo	2026-05-30 12:15:44.837981
409	16	9	-4	Order 9 update	Ilpo Alatalo	2026-05-30 12:23:40.298109
410	42	9	-2	Order 9 update	Ilpo Alatalo	2026-05-30 12:23:40.298109
411	44	9	-2	Order 9 update	Ilpo Alatalo	2026-05-30 12:23:40.298109
412	113	9	-4	Order 9 update	Ilpo Alatalo	2026-05-30 12:23:40.298109
413	25	9	-2	Order 9 update	Ilpo Alatalo	2026-05-30 12:27:01.397876
414	42	33	1	Order 33 update	Health	2026-05-30 12:28:49.912277
415	44	33	-1	Order 33 update	Health	2026-05-30 12:28:49.912277
416	42	9	-1	Order 9 update	Ilpo Alatalo	2026-05-30 12:29:32.618251
417	44	9	1	Order 9 update	Ilpo Alatalo	2026-05-30 12:29:32.618251
418	121	51	-1	Order 51 update	Health	2026-05-30 12:30:02.637538
419	25	9	-2	Order 9 update	Ilpo Alatalo	2026-05-30 12:31:44.168865
420	15	6	3	Order 6 update	Ilta Pirttilahti	2026-06-01 14:59:25.113171
421	34	6	-3	Order 6 update	Ilta Pirttilahti	2026-06-01 14:59:25.113171
422	12	6	-1	Order 6 update	Ilta Pirttilahti	2026-06-01 14:59:25.113171
423	112	6	-5	Order 6 update	Ilta Pirttilahti	2026-06-01 14:59:25.113171
424	90	6	-1	Order 6 update	Ilta Pirttilahti	2026-06-01 14:59:25.113171
425	84	6	-1	Order 6 update	Ilta Pirttilahti	2026-06-01 14:59:25.113171
426	9	6	-1	Order 6 update	Ilta Pirttilahti	2026-06-01 14:59:25.113171
427	21	60	-6	Order 60 created	mamahjo	2026-06-02 11:31:32.889863
428	15	44	-1	Order 44 update	Health	2026-06-02 12:04:44.833144
429	21	44	-1	Order 44 update	Health	2026-06-02 12:04:44.833144
430	27	44	-1	Order 44 update	Health	2026-06-02 12:04:44.833144
431	31	44	-1	Order 44 update	Health	2026-06-02 12:04:44.833144
432	32	44	-1	Order 44 update	Health	2026-06-02 12:04:44.833144
433	37	44	-1	Order 44 update	Health	2026-06-02 12:04:44.833144
434	38	44	-1	Order 44 update	Health	2026-06-02 12:04:44.833144
435	39	44	-1	Order 44 update	Health	2026-06-02 12:04:44.833144
436	15	61	-6	Order 61 created	Kimmo	2026-06-03 07:47:13.177529
437	34	61	-6	Order 61 created	Kimmo	2026-06-03 07:47:13.177529
438	21	62	-4	Order 62 created	Cappe	2026-06-03 08:27:39.850194
439	21	63	-1	Order 63 created	Jarkko Laava	2026-06-03 11:09:02.707328
440	13	8	108	Order 8 update	Kimmo	2026-06-03 12:11:10.636197
441	21	64	-1	Order 64 created	Melli Hautala	2026-06-03 12:23:20.165398
442	21	65	-1	Order 65 created	Halla	2026-06-03 12:30:48.068484
443	50	66	-4	Order 66 created	Saxon Wars	2026-06-06 11:27:44.84958
444	50	66	4	Order 66 update	Saxon Wars	2026-06-06 14:46:37.849985
\.


--
-- Name: archived_order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: infrashop
--

SELECT pg_catalog.setval('public.archived_order_items_id_seq', 1, false);


--
-- Name: archived_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: infrashop
--

SELECT pg_catalog.setval('public.archived_orders_id_seq', 1, false);


--
-- Name: items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: infrashop
--

SELECT pg_catalog.setval('public.items_id_seq', 122, true);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: infrashop
--

SELECT pg_catalog.setval('public.order_items_id_seq', 924, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: infrashop
--

SELECT pg_catalog.setval('public.orders_id_seq', 66, true);


--
-- Name: stock_audit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: infrashop
--

SELECT pg_catalog.setval('public.stock_audit_id_seq', 444, true);


--
-- Name: archived_order_items archived_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: infrashop
--

ALTER TABLE ONLY public.archived_order_items
    ADD CONSTRAINT archived_order_items_pkey PRIMARY KEY (id);


--
-- Name: archived_orders archived_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: infrashop
--

ALTER TABLE ONLY public.archived_orders
    ADD CONSTRAINT archived_orders_pkey PRIMARY KEY (id);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: infrashop
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: items items_sku_key; Type: CONSTRAINT; Schema: public; Owner: infrashop
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_sku_key UNIQUE (sku);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: infrashop
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: infrashop
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: stock_audit stock_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: infrashop
--

ALTER TABLE ONLY public.stock_audit
    ADD CONSTRAINT stock_audit_pkey PRIMARY KEY (id);


--
-- Name: archived_order_items archived_order_items_archived_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: infrashop
--

ALTER TABLE ONLY public.archived_order_items
    ADD CONSTRAINT archived_order_items_archived_order_id_fkey FOREIGN KEY (archived_order_id) REFERENCES public.archived_orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: infrashop
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: infrashop
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: infrashop
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: stock_audit stock_audit_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: infrashop
--

ALTER TABLE ONLY public.stock_audit
    ADD CONSTRAINT stock_audit_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- Name: stock_audit stock_audit_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: infrashop
--

ALTER TABLE ONLY public.stock_audit
    ADD CONSTRAINT stock_audit_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- PostgreSQL database dump complete
--

\unrestrict FTlQ2WmScZydAtQv7LUI77DcBCOpNBrvYbbQ5KwLCudxR9uUcg1tFOjoaBOG5yW

