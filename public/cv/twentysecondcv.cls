\ProvidesClass{twentysecondcv}[2026/02/10 CV class]
\LoadClass{article}
\NeedsTeXFormat{LaTeX2e}

%----------------------------------------------------------------------------------------
%	 REQUIRED PACKAGES
%-----------------------------------------------------------------------	-----------------

\RequirePackage[quiet]{fontspec}
\RequirePackage[sfdefault]{ClearSans}

\def\arrow#1{\pspicture[shift=2pt](#1,0)\psline{->}(#1,0)\endpspicture}

\usepackage{pstricks}

\usepackage{fontawesome}
\RequirePackage{tikz}
\usetikzlibrary{backgrounds}
\RequirePackage{xcolor}
\RequirePackage[absolute,overlay]{textpos}
\RequirePackage{ragged2e}
\RequirePackage{etoolbox}
\RequirePackage{ifmtarg}
\RequirePackage{ifthen}
\RequirePackage{pgffor}
\RequirePackage{marvosym}
\RequirePackage{parskip}

\usepackage{enumitem}
\setlist[itemize]{leftmargin=*}

\RequirePackage{array}
\RequirePackage{multirow}

\RequirePackage[hidelinks]{hyperref}
\hypersetup{
    pdftitle={},
    pdfauthor={},
    pdfsubject={},
    pdfkeywords={},
    colorlinks=false,           % no lik border color
    allbordercolors=white       % white border color for all
}

\DeclareOption*{\PassOptionsToClass{\CurrentOption}{article}}
\ProcessOptions\relax

\ifxetex
  \usepackage{letltxmacro}
  \setlength{\XeTeXLinkMargin}{1pt}
  \LetLtxMacro\SavedIncludeGraphics\includegraphics
  \def\includegraphics#1#{% #1 catches optional stuff (star/opt. arg.)
    \IncludeGraphicsAux{#1}%
  }%
  \newcommand*{\IncludeGraphicsAux}[2]{%
    \XeTeXLinkBox{%
      \SavedIncludeGraphics#1{#2}%
    }%
  }%
\fi

%----------------------------------------------------------------------------------------
%	 COLOURS
%----------------------------------------------------------------------------------------

\definecolor{white}{RGB}{255,255,255}
\definecolor{gray}{HTML}{4D4D4D}
\definecolor{sidecolor}{HTML}{E7E7E7}
\definecolor{mainblue}{HTML}{0E5484}
\definecolor{maingray}{HTML}{B9B9B9}

\definecolor{pblue}{HTML}{0395DE}

\definecolor{darkgray}{HTML}{333333}
\definecolor{gray}{HTML}{4D4D4D}
\definecolor{lightgray}{HTML}{999999}
\definecolor{green}{HTML}{C2E15F}
\definecolor{orange}{HTML}{FDA333}
\definecolor{purple}{HTML}{D3A4F9}
\definecolor{red}{HTML}{FB4485}
\definecolor{blue}{HTML}{6CE0F1}
\definecolor{pblue}{HTML}{0395DE}
\definecolor{materialpurple}{HTML}{9C27B0}
\definecolor{materialindigo}{HTML}{3F51B5}
\definecolor{materialblue}{HTML}{2196F3}
\definecolor{materialcyan}{HTML}{00BCD4}
\definecolor{materialteal}{HTML}{009688}
\definecolor{materialgreen}{HTML}{4CAF50}
\definecolor{materiallime}{HTML}{CDDC39}
\definecolor{materialamber}{HTML}{FFC107}
\definecolor{materialbrown}{HTML}{795548}
\definecolor{materialred}{HTML}{FF4436}
\definecolor{materialorange}{HTML}{FF5722}
\definecolor{linkedin}{HTML}{0085AE}
\definecolor{test}{HTML}{0077be}
\definecolor{yt}{HTML}{c71610}

\ifdefined\@cv@print
  \colorlet{green}{gray}
  \colorlet{orange}{gray}
  \colorlet{purple}{gray}
  \colorlet{red}{gray}
  \colorlet{blue}{gray}
  \colorlet{fillheader}{white}
  \colorlet{header}{gray}
\else
  \colorlet{fillheader}{white}
  \colorlet{header}{gray}
\fi
\colorlet{textcolor}{gray}
\colorlet{headercolor}{gray}

%----------------------------------------------------------------------------------------
%	 MISC CONFIGURATIONS
%----------------------------------------------------------------------------------------

% \renewcommand{\bfseries}{\color{black}} % Make \textbf produce coloured text instead

\pagestyle{empty} % Disable headers and footers

\setlength{\parindent}{0pt} % Disable paragraph indentation

% --------------------------------------------------------------------------------------
% 	FONTS
%-------------------------------------------------------------------------------------
\newfontfamily\headingfont[Path = fonts/]{segoeuib.ttf}

%----------------------------------------------------------------------------------------
%	 SIDEBAR DEFINITIONS
%----------------------------------------------------------------------------------------

\setlength{\TPHorizModule}{1cm} % Left margin
\setlength{\TPVertModule}{1cm} % Top margin

\newlength\imagewidth
\newlength\imagescale
\pgfmathsetlength{\imagewidth}{5cm}
\pgfmathsetlength{\imagescale}{\imagewidth/600}

\newcommand{\profilesection}[2]{\vspace{8pt}{\color{black!80} \huge #1 \rule[0.15\baselineskip]{#2}{1pt}}}

% Define custom commands for CV info
\newcommand{\cvdate}[1]{\renewcommand{\cvdate}{#1}}
\newcommand{\cvlinkedin}[1]{\renewcommand{\cvlinkedin}{#1}}
\newcommand{\cvgithub}[1]{\renewcommand{\cvgithub}{#1}}
\newcommand{\cvmail}[1]{\renewcommand{\cvmail}{#1}}
\newcommand{\cvnumberphone}[1]{\renewcommand{\cvnumberphone}{#1}}
\newcommand{\cvaddress}[1]{\renewcommand{\cvaddress}{#1}}
\newcommand{\cvsite}[1]{\renewcommand{\cvsite}{#1}}
\newcommand{\aboutme}[1]{\renewcommand{\aboutme}{#1}}
\newcommand{\profilepic}[1]{\renewcommand{\profilepic}{#1}}
\newcommand{\cvname}[1]{\renewcommand{\cvname}{#1}}
\newcommand{\cvjobtitle}[1]{\renewcommand{\cvjobtitle}{#1}}
% Optional extra blocks in the left sidebar (e.g. mini timeline); empty by default
\newcommand{\cvsideextra}{}
\newcommand{\cvsideextracontent}[1]{\renewcommand{\cvsideextra}{#1}}

% Command for printing the contact information icons
\newcommand*\icon[1]{\tikz[baseline=(char.base)]{\node[shape=circle,draw,inner sep=1pt, fill=mainblue,mainblue,text=white] (char) {#1};}}

% Command for printing skill progress bars (row height allows wrapped labels; 4+ rows fit in sidebar)
\newcommand\programming[1]{
	\renewcommand{\programming}{%
		\begin{tikzpicture}[x=1cm,y=1cm]
			\foreach [count=\i] \x/\y in {#1}{
				\pgfmathsetmacro{\barbase}{\i*1.12-1.12}
				\node[anchor=south west,font=\footnotesize\bfseries,text=black!75,text width=5.5cm,align=left,inner sep=0pt] at (0,\barbase+0.5) {\x};
				\draw[fill=maingray,maingray,rounded corners=1pt] (0,\barbase) rectangle (6,\barbase+0.34);
				\draw[fill=white,mainblue,rounded corners=1pt](0,\barbase) rectangle (\y,\barbase+0.34);
			}
		\end{tikzpicture}%
	}
}
\newcommand\education[1]{
	\renewcommand{\education}{
		{#1}
	}
}

%----------------------------------------------------------------------------------------
%  SIDEBAR LAYOUT
%----------------------------------------------------------------------------------------

\newcommand{\makeprofile}{
  \begin{tikzpicture}[remember picture,overlay]
      \node [rectangle, fill=sidecolor, anchor=north, minimum width=9cm, minimum height=\paperheight+1cm] (box) at (-5cm,0.5cm){};
  \end{tikzpicture}

  %------------------------------------------------

  \begin{textblock}{6}(0.5, 0.2)

    %------------------------------------------------

        \vspace{4mm}
    {\Huge\color{pblue}\cvname}

    \vspace{2mm}

    %------------------------------------------------

    {\Large\color{black!80}\cvjobtitle}

    %------------------------------------------------

    \vspace{3mm}
    \renewcommand{\arraystretch}{2}
    \begin{tabular}{p{1cm} @{\hskip 0.5cm}p{5cm}}
      \ifthenelse{\equal{\cvnumberphone}{}}{}{
      		{$
              \begin{array}{l}
              \hspace{4mm} \Huge \textnormal{\faMobile}
              \end{array}
              $}
            & \cvnumberphone\\}

      \ifthenelse{\equal{\href{\cvsite}{\cvsite}}{}}{}{
            {$
              \begin{array}{l}
              \hspace{2.8mm} \huge \textnormal{\textcolor{test}{\faGlobe}}
              \end{array}
              $}
            & \href{http://\cvsite}{\cvsite} \\}
      \ifthenelse{\equal{\cvmail}{}}{}{
            {$
              \begin{array}{l}
              \hspace{2.5mm} \huge \textnormal{\textcolor{yt}{\faEnvelopeO}}
              \end{array}
              $}
            & \href{mailto:\cvmail}{\cvmail} \\}

       \ifthenelse{\equal{\cvlinkedin}{}}{}{
            {$
              \begin{array}{l}
              \hspace{3mm} \huge \textnormal{\textcolor{linkedin}{\faLinkedin}}
              \end{array}
              $} & \href{https://linkedin.com\cvlinkedin}{\cvlinkedin} \\
            }
        \ifthenelse{\equal{\cvgithub}{}}{}{
            {$
              \begin{array}{l}
              \hspace{3mm} \huge \textnormal{\faGithub}
              \end{array}
              $} & \href{https://github.com/\cvgithub}{\cvgithub} \\
            }

    \end{tabular}

    %------------------------------------------------
    \vspace{3mm}
    \profilesection{\cvSidebarTechnicalSkills}{1.2cm}

    {\large \textbf{\cvSidebarOverview}}

	\skills

        %------------------------------------------------

        \vspace{7mm}

	 {\large \cvskillshublabel}

		 \programming

        \cvsideextra

        \vspace{7mm}
        \profilesection{\cvSidebarEducation}{3cm}

        \education

  \end{textblock}
}


%----------------------------------------------------------------------------------------
%	 COLOURED SECTION TITLE BOX
%----------------------------------------------------------------------------------------

% Command to create the rounded boxes around the first three letters of section titles
\newcommand*\round[2]{%
	\tikz[baseline=(char.base)]\node[anchor=north west, draw,rectangle, rounded corners, inner sep=1.6pt, minimum size=5.5mm, text height=3.6mm, fill=#2,#2,text=white](char){#1};%
}

\def\@sectioncolor#1#2#3{%
	{%
		\color{pblue} #1#2#3%
	}%
}


\renewcommand{\section}[1]{
  \par\vspace{\parskip}
	{%
		\LARGE\headingfont\color{headercolor}%
		\@sectioncolor #1%
	}
  \par\vspace{1mm}
}

\renewcommand{\subsection}[1]{
	\par\vspace{.5\parskip}{%
		\Large\headingfont\color{headercolor} #1%
	}
	\par\vspace{.25\parskip}%
}

\pagestyle{empty}

%----------------------------------------------------------------------------------------
%	 LONG LIST ENVIRONMENT
%----------------------------------------------------------------------------------------

\setlength{\tabcolsep}{0pt}

% New environment for the long list
\newenvironment{twenty}{%
	\begin{tabular*}{\textwidth}{@{\extracolsep{\fill}}ll}
}{%
	\end{tabular*}
}

% \newcommand{\twentyitem}[5]{%
% 	#1&\parbox[t]{0.83\textwidth}{%
% 		\textbf{#2}%
% 		\hfill%
% 		{\footnotesize#3}\\%
%         \ifblank{#4}{}{#4 \\}
% 		#5\vspace{\parsep}%
% 	}\\
% }

\newcommand{\twentyitem}[6]{%
	#1&\parbox[t]{0.83\textwidth}{%
		\textbf{#3}%
		\hfill%
		{\footnotesize#4}%
        }\\%
    #2&\parbox[t]{0.83\textwidth}{%
		\ifblank{#5}{}{#5 \\}
		#6%
	}\\
}

% Experience list with vertical timeline + icons (main column, right of sidebar)
\newcounter{tlitem}
\newcommand{\twentytimelinedraw}{%
	\ifnum\value{tlitem}>1\relax
	\begin{tikzpicture}[remember picture,overlay]
		\pgfmathtruncatemacro{\tlmax}{\arabic{tlitem}-1}%
		\foreach \x in {1,...,\tlmax}{%
			\pgfmathtruncatemacro{\nexttl}{\x+1}%
			\draw[mainblue,line width=0.85pt]
				([yshift=-0.06cm]TL-\x.south) -- ([yshift=0.06cm]TL-\nexttl.north);
		}
	\end{tikzpicture}%
	\fi
}
\newenvironment{twentytimeline}{%
	\setcounter{tlitem}{0}%
	\begin{tabular*}{\textwidth}{@{}>{\centering\arraybackslash}m{0.82cm}@{\hspace{1.5mm}}m{1.9cm}@{\hspace{2mm}}p{\dimexpr\textwidth-0.82cm-1.9cm-3.5mm\relax}@{}}
}{%
	\end{tabular*}%
	\leavevmode\smash{\twentytimelinedraw}%
}
% #1 = FontAwesome icon (e.g. \faCloud); #2–#7 same as \twentyitem date1, date2, title, org, location, body
\newcommand{\twentyitemtimeline}[7]{%
	\stepcounter{tlitem}%
	\multirow{2}{*}[-0.4ex]{%
		\begin{tikzpicture}[remember picture,baseline=-0.15ex]
			\node[circle,fill=mainblue,text=white,font=\scriptsize,minimum size=0.40cm,inner sep=0pt]
				(TL-\arabic{tlitem}) {#1};
		\end{tikzpicture}%
	}%
	& #2 & \parbox[t]{\linewidth}{\textbf{#4}\hfill{\footnotesize #5}}\\%
	& #3 & \parbox[t]{\linewidth}{\ifblank{#6}{}{#6 \\}#7\vspace{0.35ex}}\\%
}

%----------------------------------------------------------------------------------------
%	 SMALL LIST ENVIRONMENT
%----------------------------------------------------------------------------------------

\setlength{\tabcolsep}{0pt}

% New environment for the small list
\newenvironment{twentyshort}{%
	\begin{tabular*}{\textwidth}{@{\extracolsep{\fill}}ll}
}{%
	\end{tabular*}
}

\newcommand{\twentyitemshort}[2]{%
	#1&\parbox[t]{0.83\textwidth}{%
		#2%
	}\\
}

%----------------------------------------------------------------------------------------
%	 MARGINS AND LINKS
%----------------------------------------------------------------------------------------

\RequirePackage[left=7.6cm,top=0.1cm,right=1cm,bottom=0.1cm,nohead,nofoot]{geometry}


\usepackage{smartdiagram}
\smartdiagramset{
    bubble center node font = \footnotesize,
    bubble node font = \footnotesize,
    % specifies the minimum size of the bubble center node
    bubble center node size = 0.5cm,
    %  specifies the minimum size of the bubbles
    bubble node size = 0.5cm,
    % specifies which is the distance among the bubble center node and the other bubbles
    distance center/other bubbles = 0.3cm,
    % sets the distance from the text to the border of the bubble center node
    distance text center bubble = 0.5cm,
    % set center bubble color
    bubble center node color = pblue,
    % define the list of colors usable in the diagram
    set color list = {lightgray, materialcyan, orange, green, materialorange, materialteal, materialamber, materialindigo, materialgreen, materiallime},
    % sets the opacity at which the bubbles are shown
    bubble fill opacity = 0.6,
    % sets the opacity at which the bubble text is shown
    bubble text opacity = 1,
}

% Sidebar skill block strings (renew per language in each CV .tex)
\providecommand{\cvSidebarTechnicalSkills}{Technical Skills}
\providecommand{\cvSidebarOverview}{Overview}
\providecommand{\cvSidebarEducation}{Education}
% Backdrop bubble + “Programming” heading above skill bars (same string)
\providecommand{\cvskillshublabel}{\textbf{Programming}}
\newcommand{\cvSkillsBubblesWrap}[1]{%
  \begin{tikzpicture}[baseline=(cvskillhub)]
    \coordinate (cvskillhub) at (0,0);
    \begin{scope}[on background layer]
      \node[circle, fill=maingray, fill opacity=0.34, draw=maingray!55, draw opacity=0.5, line width=0.35pt, minimum size=2.95cm, font=\footnotesize\bfseries, text=black!50, align=center, inner sep=4pt] at (cvskillhub) {\cvskillshublabel};
    \end{scope}
    \node[inner sep=0, anchor=center] at (cvskillhub) {#1};%
  \end{tikzpicture}%
}
