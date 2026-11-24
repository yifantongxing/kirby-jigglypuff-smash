/* Final Smash hit regions and effect anchors, projected from the original
   Kirby and Purin d04 motion clips. Distances here use native fighter units. */
(() => {
'use strict';
const tracks={
  bladeHit:[
    [54,9.808,7.24,8.472,20.007,7.21,32.065,9.021,31.3],[55,15.092,4.54,26.947,15.327,38.144,25.514,35.9,24.612],[56,16.248,1.722,37.583,5.629,57.732,9.32,51.636,9.861],[57,11.901,1.754,30.904,1.816,48.852,1.875,42.172,5.132],[58,0.675,2.646,6.869,2.008,12.72,1.406,10.821,-3.189],
    [59,-4.619,4.194,-8.332,3.05,-11.838,1.97,-12.64,-2.432],[60,-5.078,6.303,-12.222,4.609,-18.968,3.009,-20.04,-1.315],
  ],
  d04finalstart:[
    [0,-2.515,3.485,23.214,1.878,-0.0,4.241,2.204,3.115],[3,-2.67,14.056,-11.164,52.396,0.001,7.981,-4.244,21.191],[6,-5.131,7.378,-27.194,26.326,-0.008,4.632,-9.236,10.902],[9,-5.757,6.029,-30.779,21.184,-0.013,3.981,-10.43,8.872],[12,-5.628,6.535,-30.066,22.585,-0.012,4.301,-10.182,9.532],
    [15,-5.624,6.496,-30.121,22.508,-0.012,4.21,-10.191,9.487],[18,-5.664,6.382,-30.398,22.194,-0.012,4.09,-10.279,9.34],[21,-1.159,6.156,-5.885,42.181,-0.144,3.721,-2.201,14.388],[24,4.221,7.436,2.591,41.418,-0.439,4.772,3.71,20.519],[27,2.497,11.584,-23.469,33.33,-0.76,5.713,-11.54,23.348],
    [30,0.937,14.442,-33.267,32.306,-1.102,6.728,-18.944,24.824],[33,-0.02,15.917,-36.675,31.931,-1.231,7.176,-21.324,25.219],[36,-0.891,15.967,-39.261,29.101,-1.32,7.256,-23.195,23.597],[39,-1.568,15.213,-41.43,25.317,-1.395,7.116,-24.741,21.084],[42,-2.03,14.072,-43.06,22.526,-1.458,6.875,-25.884,18.986],
    [45,-2.147,12.945,-43.978,20.075,-1.499,6.587,-26.467,17.09],[48,-1.487,12.15,-42.486,22.095,-1.511,6.258,-25.324,17.932],[51,2.098,10.679,-31.548,31.383,-0.954,5.518,-17.463,22.716],[54,9.808,7.24,6.617,37.739,2.252,4.413,7.953,24.973],[57,11.901,1.754,57.298,1.902,9.646,4.218,38.301,1.824],
    [60,-5.078,6.303,-22.143,2.257,2.29,4.064,-13.482,4.31],[63,-5.642,7.2,-18.833,3.593,0.151,5.055,-13.558,5.063],[66,-6.738,7.367,-20.867,3.897,-0.677,5.339,-15.22,5.312],[69,-8.109,5.798,-24.853,2.926,-0.942,3.745,-18.122,4.081],[72,-7.727,6.186,-24.216,3.233,-0.512,4.104,-17.585,4.421],
    [75,-7.041,7.08,-22.49,3.806,-0.169,4.869,-16.277,5.122],[78,-6.941,6.666,-22.457,3.519,-0.012,4.52,-16.219,4.784],[81,-8.187,5.749,-19.454,4.013,-0.0,3.917,-18.506,4.159],[84,-7.838,6.161,-8.071,6.119,-0.0,4.604,-17.607,4.401],[87,-5.942,5.715,-6.156,5.667,-0.0,5.312,-14.885,3.711],
    [89,-5.383,4.41,-5.605,4.366,-0.0,5.0,-14.669,2.544],
  ],
  d04finalattack:[
    [0,-6.252,4.365,-24.829,0.096,0.0,4.334,-17.725,1.513],[2,-5.569,3.59,-36.06,6.753,0.0,4.227,-25.499,5.74],[4,-5.041,1.856,-30.973,6.392,-0.0,3.269,-22.271,4.867],[6,-5.247,1.502,-30.854,5.875,-0.0,2.979,-22.261,4.406],[8,-5.448,1.372,-29.775,5.812,-0.0,2.982,-21.617,4.323],
    [10,-5.83,1.443,-29.059,6.142,-0.0,2.99,-21.284,4.568],[12,-6.284,1.675,-28.755,6.596,-0.0,3.009,-21.244,4.951],[14,-6.702,1.972,-28.742,7.08,0.041,3.011,-21.375,5.375],[16,-6.876,2.238,-28.782,7.484,0.036,3.063,-21.458,5.735],[18,-5.253,1.916,-33.233,1.463,0.087,3.666,-24.06,1.602],
    [20,12.266,9.294,41.216,5.42,6.437,8.146,31.501,6.716],[22,1.51,23.569,16.053,46.002,4.068,16.687,11.096,38.479],[24,1.058,24.744,13.964,48.684,4.181,17.024,9.564,40.65],[26,0.715,22.741,13.05,44.528,4.289,16.257,8.872,37.218],[28,14.289,16.731,-15.871,26.515,22.922,16.41,-5.803,23.232],
    [30,61.662,36.083,90.413,44.028,60.639,29.419,80.765,41.363],[32,62.519,37.604,88.712,52.415,61.385,30.255,79.926,47.447],[34,60.382,15.441,36.879,7.246,62.018,19.825,44.694,9.74],[36,70.304,11.545,50.06,-7.845,65.695,14.085,56.853,-1.339],[38,71.185,11.468,48.63,-5.954,65.858,13.553,56.364,-0.138],
    [40,70.517,4.953,63.228,-17.343,66.006,5.71,65.68,-9.864],[42,68.38,-5.308,92.24,-18.96,62.217,-7.054,84.234,-14.38],[44,68.841,-6.464,96.375,-19.673,62.019,-7.667,87.134,-15.239],[46,57.722,2.25,57.064,-25.761,62.114,-0.793,57.254,-16.346],[48,70.526,9.068,54.089,27.488,66.507,5.488,59.605,21.308],
    [50,73.423,9.925,56.989,28.349,69.658,5.709,62.502,22.165],[52,71.709,8.989,65.877,21.809,67.139,5.988,67.834,17.508],[54,11.652,30.925,-23.353,35.371,14.786,27.498,-11.598,33.884],[56,11.819,34.767,-12.047,38.189,13.453,30.014,-4.029,37.048],[58,10.958,12.252,36.383,2.844,9.861,18.76,27.828,5.969],
    [60,0.779,11.059,20.719,-7.701,5.35,14.01,13.878,-1.585],[62,0.683,10.928,18.765,-9.253,5.209,14.115,12.591,-2.596],[64,1.325,10.846,16.71,-12.965,5.237,14.69,11.548,-4.976],[66,26.418,40.051,37.051,72.729,30.154,37.492,33.5,61.789],[68,27.153,38.533,42.29,63.405,31.72,36.351,37.21,55.059],
    [70,42.129,29.249,26.874,5.557,37.482,32.715,32.22,13.24],[72,52.363,32.209,72.552,9.825,47.093,32.977,65.777,17.347],[74,52.287,33.598,67.486,5.389,48.455,34.268,62.419,14.839],[76,69.957,19.535,92.045,9.076,65.935,21.929,84.67,12.612],[78,72.266,21.761,107.336,14.452,69.807,18.917,95.794,17.049],
    [80,72.589,23.365,102.106,18.003,70.11,18.105,92.202,19.802],[82,60.291,7.207,35.022,18.96,63.528,10.844,43.52,14.959],[84,64.675,2.042,40.908,-11.177,61.291,4.956,48.849,-6.74],[86,64.1,2.074,42.968,-14.692,61.53,5.65,50.05,-9.065],[88,64.08,1.899,45.074,-17.183,61.568,5.461,51.452,-10.781],
    [90,9.155,-2.162,36.408,11.719,11.777,-5.59,27.215,7.067],[92,5.985,-1.934,25.142,17.265,8.186,-6.528,18.714,10.823],[94,4.182,-6.243,-12.767,15.57,7.564,-6.105,-7.191,8.23],[96,8.903,3.917,35.822,0.179,4.626,3.381,26.79,1.445],[98,4.166,5.138,33.241,15.327,5.779,3.57,23.484,11.908],
    [100,4.017,5.432,32.714,16.709,6.045,3.592,23.084,12.925],[102,25.914,12.208,-5.53,6.976,25.997,12.247,4.934,8.8],[104,69.344,6.486,96.677,1.865,73.967,6.782,87.491,3.42],[106,68.287,3.311,93.159,-2.796,69.93,5.506,84.786,-0.761],[108,61.686,15.488,36.12,4.76,61.329,4.529,44.674,8.379],
    [110,69.08,20.604,48.584,41.496,63.959,16.561,55.48,34.497],[112,70.666,20.362,50.521,40.562,65.431,16.951,57.281,33.784],[114,50.099,17.582,50.204,32.412,43.628,16.468,51.991,27.795],[116,-6.909,9.706,22.968,22.645,-4.466,5.228,12.711,18.454],[118,-7.405,11.256,12.286,26.919,-8.141,5.398,5.679,21.663],
    [120,-5.871,11.292,-8.16,28.926,-8.703,5.419,-7.391,23.052],[122,-4.913,10.155,-20.106,27.259,-8.382,5.403,-15.26,21.838],[124,-4.863,9.938,-26.372,26.347,-7.606,5.179,-20.145,21.601],[126,-5.625,11.184,-29.382,27.333,-7.677,5.781,-23.463,23.31],[128,-6.224,12.634,-31.061,27.481,-7.73,6.453,-26.116,24.525],
    [130,-6.606,14.519,-31.539,28.491,-7.779,7.177,-28.019,26.518],[132,-6.78,15.511,-31.568,29.046,-7.808,7.474,-29.656,27.999],[134,-6.926,16.111,-31.852,29.174,-7.85,7.574,-31.631,29.056],[136,-7.048,16.328,-32.188,28.853,-7.874,7.601,-33.74,29.625],[138,-7.262,16.576,-32.674,28.396,-7.905,7.751,-36.049,29.964],
    [140,-7.515,16.639,-33.751,28.038,-8.03,7.756,-38.333,30.027],[142,-7.715,16.778,-37.923,28.885,-8.119,7.876,-40.515,29.922],[144,-7.676,16.895,-44.85,30.911,-7.974,7.928,-42.292,29.946],[146,-8.105,16.901,-45.541,30.019,-8.261,7.938,-44.389,29.614],[148,-7.932,16.89,-45.549,29.386,-8.011,7.945,-45.589,29.398],
    [150,-8.326,16.953,-46.075,29.122,-8.294,8.054,-47.035,29.43],[152,-8.406,16.883,-46.284,28.636,-8.307,8.059,-47.837,29.117],[154,-8.47,16.771,-46.469,28.192,-8.32,8.057,-48.236,28.722],[156,-8.478,16.649,-46.576,27.762,-8.33,8.052,-48.348,28.278],[158,-8.181,16.502,-46.429,27.069,-8.075,8.033,-48.208,27.559],
    [160,-8.135,16.359,-46.496,26.475,-8.078,8.0,-48.28,26.944],[162,-8.329,16.17,-46.758,26.074,-8.347,7.95,-48.545,26.533],[164,-7.992,15.953,-46.365,26.259,-8.081,7.88,-48.149,26.738],[166,-7.779,15.695,-45.842,27.603,-8.076,7.771,-47.611,28.156],[168,-7.31,15.276,-44.388,31.204,-8.318,7.595,-46.111,31.943],
    [170,-5.516,14.297,-39.96,37.268,-7.907,7.251,-41.56,38.336],[172,-1.155,9.058,-23.781,42.386,-6.569,4.326,-24.816,43.951],[174,5.636,0.852,51.565,9.374,-1.328,3.549,53.698,9.77],[176,-6.457,1.559,0.157,-28.131,-0.935,4.079,-0.333,-26.066],[178,-6.99,4.59,-23.29,-22.447,-0.96,4.787,-22.146,-20.563],
    [180,-6.577,5.828,-27.578,-19.51,-0.98,5.252,-26.104,-17.743],[182,-6.606,6.074,-29.461,-18.107,-1.053,5.492,-27.859,-16.42],[184,-6.907,5.806,-31.879,-16.442,-1.201,5.169,-30.132,-14.889],[186,-7.262,5.095,-34.292,-15.167,-1.39,4.357,-32.404,-13.753],[188,-7.625,4.738,-36.095,-14.129,-1.567,4.041,-34.108,-12.813],
    [190,-7.874,4.707,-36.607,-14.006,-1.67,4.203,-34.601,-12.7],[192,-7.745,4.89,-35.734,-14.493,-1.66,4.494,-33.78,-13.141],[194,-7.507,4.986,-34.516,-15.244,-1.601,4.736,-32.63,-13.832],[196,-7.356,5.034,-33.9,-15.554,-1.568,4.835,-32.046,-14.118],[198,-7.421,4.941,-34.356,-15.349,-1.579,4.771,-32.476,-13.933],
    [200,-7.555,4.778,-35.234,-14.943,-1.599,4.654,-33.302,-13.567],[202,-7.654,4.65,-36.039,-14.556,-1.605,4.578,-34.058,-13.216],[204,-7.576,4.713,-36.078,-14.416,-1.564,4.69,-34.089,-13.081],[206,-7.253,5.244,-35.524,-14.477,-1.342,5.258,-33.548,-13.101],[208,-6.573,6.598,-33.517,-15.892,-0.963,6.632,-31.614,-14.323],
    [210,-5.312,6.422,-28.173,-20.131,-0.558,8.221,-21.045,-11.875],[212,-4.602,5.292,-24.632,-22.557,-0.282,8.598,-4.597,5.293],[214,-4.285,4.299,-25.187,-16.347,-0.086,7.901,-4.285,4.299],[216,-3.085,4.771,-27.629,-7.921,0.003,5.921,-3.085,4.771],[218,-3.309,5.704,-12.455,6.277,0.002,5.437,-3.308,5.704],
    [220,-3.838,8.591,19.804,29.405,0.0,5.07,-3.837,8.591],[221,-3.697,9.222,20.564,30.493,0.0,5.0,-3.697,9.222],
  ],
  d04finalstartr:[
    [0,1.0,1.0,0.0,5.0],[39,1.0,1.0,0.0,5.0],[42,1.161,1.161,0.0,6.017],[45,1.596,1.596,0.0,8.685],[48,2.234,2.234,0.0,12.425],
    [51,3.003,3.003,0.0,16.662],[54,3.832,3.832,0.0,20.818],[57,4.648,4.648,0.0,24.317],[60,5.523,5.523,0.0,26.639],[63,6.476,6.476,0.0,28.157],
    [66,7.352,7.352,0.0,29.212],[69,8.0,8.0,0.0,29.973],[72,8.344,8.344,0.0,30.608],[75,8.478,8.478,0.0,31.286],[78,8.5,8.5,0.0,32.177],
    [81,8.517,8.517,0.0,33.451],[84,8.706,8.706,0.0,35.275],[87,9.287,9.287,0.0,37.82],[90,10.426,10.426,0.0,41.249],[93,11.598,11.598,0.0,45.541],
    [96,12.617,12.617,0.0,50.443],[99,13.489,13.489,0.0,55.691],[102,14.219,14.219,0.0,61.021],[105,14.815,14.815,0.0,66.169],[108,15.283,15.283,0.0,70.869],
    [111,15.628,15.628,0.0,74.857],[114,15.858,15.858,0.0,77.868],[117,15.978,15.978,0.0,79.639],[119,16.0,16.0,0.0,80.0],
  ],
  d04final:[
    [0,16.0,16.0,0.0,85.0],[62,16.0,16.0,0.0,85.0],[63,10.954,17.346,0.0,85.0],[66,24.184,20.124,0.0,85.0],[69,19.953,13.739,0.0,85.0],
    [72,17.159,14.555,0.0,85.0],[75,16.0,16.0,0.0,85.0],[120,16.0,16.0,0.0,85.0],
  ],
  d04finalendr:[
    [0,16.0,16.0,0.0,5.0],[3,14.027,13.03,0.0,5.0],[6,25.225,20.593,0.0,5.0],[9,16.007,11.911,0.0,5.0],[12,18.124,17.672,0.0,5.0],
    [15,9.124,11.301,0.0,5.0],[18,13.275,13.613,0.0,5.0],[21,12.926,12.934,0.0,5.0],[24,12.786,12.831,0.0,5.0],[27,12.606,12.712,0.0,5.0],
    [30,12.381,12.563,0.0,5.0],[33,12.105,12.37,0.0,5.0],[36,11.772,12.119,0.0,5.0],[39,11.377,11.797,0.0,5.0],[42,10.914,11.39,0.0,5.0],
    [45,10.378,10.884,0.0,5.0],[48,9.761,10.266,0.0,5.0],[51,9.06,9.521,0.0,5.0],[54,8.268,8.636,0.0,5.0],[57,7.38,7.597,0.0,5.0],
    [60,6.39,6.39,0.0,5.0],[63,5.377,5.163,0.0,5.0],[66,4.43,4.073,0.0,5.0],[69,3.561,3.126,0.0,5.0],[72,2.782,2.328,0.0,5.0],
    [75,2.104,1.685,0.0,5.0],[78,1.539,1.202,0.0,5.0],[81,1.1,0.884,0.0,5.0],[84,0.797,0.738,0.0,5.0],[87,0.627,0.728,0.0,5.0],
    [90,0.538,0.735,0.0,5.0],[93,0.504,0.76,0.0,5.0],[96,0.5,0.817,0.0,5.0],[99,0.5,0.917,0.0,5.0],[102,0.5,0.993,0.0,5.0],
    [103,0.5,1.0,0.0,5.0],[110,0.5,1.0,0.0,5.0],[111,0.506,1.0,0.0,5.0],[114,0.588,1.0,0.0,5.0],[117,0.725,1.0,0.0,5.0],
    [119,0.824,1.0,0.0,5.0],
  ],
  d04finalairstartr:[
    [0,1.0,1.0,0.688,4.869],[3,1.0,1.0,0.68,5.138],[6,1.0,1.0,0.664,5.344],[9,1.0,1.0,0.658,5.477],[12,1.0,1.0,0.668,5.529],
    [15,1.0,1.0,0.682,5.527],[18,1.0,1.0,0.694,5.504],[21,1.0,1.0,0.694,5.488],[24,1.0,1.0,0.674,5.526],[27,1.0,1.0,0.589,5.773],
    [30,1.0,1.0,0.461,5.861],[33,1.0,1.0,0.359,4.885],[36,1.0,1.0,0.246,4.693],[39,1.0,1.0,0.152,4.975],[42,1.161,1.161,0.141,5.711],
    [45,1.596,1.596,0.218,7.735],[48,2.234,2.234,0.324,10.647],[51,3.003,3.003,0.437,14.248],[54,3.832,3.832,0.558,20.041],[57,4.648,4.648,0.677,26.65],
    [60,5.523,5.523,0.804,31.142],[63,6.476,6.476,0.943,34.896],[66,7.352,7.352,1.071,40.665],[69,8.0,8.0,1.165,44.775],[72,8.344,8.344,1.215,42.99],
    [75,8.478,8.478,1.235,40.194],[78,8.5,8.5,1.238,40.997],[81,8.517,8.517,1.241,41.986],[84,8.706,8.706,1.268,41.516],[87,9.287,9.287,1.353,44.117],
    [90,10.426,10.426,1.519,52.922],[93,11.598,11.598,1.689,62.177],[96,12.617,12.617,1.838,68.178],[99,13.489,13.489,1.965,73.759],[102,14.219,14.219,2.071,79.914],
    [105,14.815,14.815,2.158,83.961],[108,15.283,15.283,2.226,84.565],[111,15.628,15.628,2.276,84.357],[114,15.858,15.858,2.31,84.708],[117,15.978,15.978,2.327,83.538],
    [119,16.0,16.0,2.331,82.842],
  ],
  d04finalair:[
    [0,16.0,16.0,2.331,82.842],[3,16.0,16.0,2.331,79.385],[6,16.0,16.0,2.331,73.31],[9,16.0,16.0,2.331,66.091],[12,16.0,16.0,2.331,62.994],
    [15,16.0,16.0,2.331,68.74],[18,16.0,16.0,2.331,78.131],[21,16.0,16.0,2.331,81.475],[24,16.0,16.0,2.331,80.468],[27,16.0,16.0,2.331,81.032],
    [30,16.0,16.0,2.331,80.182],[33,16.0,16.0,2.331,74.121],[36,16.0,16.0,2.331,68.06],[39,16.0,16.0,2.331,67.21],[42,16.0,16.0,2.331,67.774],
    [45,16.0,16.0,2.331,65.741],[48,16.0,16.0,2.331,65.1],[51,16.0,16.0,2.331,69.888],[54,16.0,16.0,2.331,75.163],[57,16.0,16.0,2.331,75.986],
    [60,16.0,16.0,2.331,76.422],[63,10.954,17.346,1.596,87.318],[66,24.184,20.124,3.523,105.007],[69,19.953,13.739,2.906,70.042],[72,17.159,14.555,2.499,72.415],
    [75,16.0,16.0,2.331,82.037],[78,16.0,16.0,2.331,83.936],[81,16.0,16.0,2.331,82.131],[84,16.0,16.0,2.331,80.939],[87,16.0,16.0,2.331,82.5],
    [90,16.0,16.0,2.331,83.521],[93,16.0,16.0,2.331,82.422],[96,16.0,16.0,2.331,81.816],[99,16.0,16.0,2.331,82.706],[102,16.0,16.0,2.331,82.835],
    [105,16.0,16.0,2.331,82.737],[108,16.0,16.0,2.331,82.61],[111,16.0,16.0,2.331,82.855],[114,16.0,16.0,2.331,82.55],[117,16.0,16.0,2.331,82.746],
    [120,16.0,16.0,2.331,82.842],
  ],
  d04finalairendr:[
    [0,16.0,16.0,2.255,82.804],[3,14.027,13.03,1.788,67.46],[6,25.225,20.593,2.853,106.766],[9,16.007,11.911,1.552,61.779],[12,18.124,17.672,1.435,91.517],
    [15,9.124,11.3,0.554,58.312],[18,13.275,13.613,0.572,69.925],[21,12.926,12.934,0.369,66.176],[24,12.786,12.831,0.247,65.39],[27,12.606,12.712,0.588,64.565],
    [30,12.381,12.563,0.962,63.803],[33,12.105,12.37,-0.145,62.746],[36,11.772,12.119,-4.312,61.257],[39,11.377,11.797,-9.75,59.314],[42,10.914,11.39,-13.62,56.909],
    [45,10.378,10.884,-14.534,54.046],[48,9.761,10.266,-12.241,50.723],[51,9.06,9.521,-6.494,46.802],[54,8.268,8.636,0.576,42.206],[57,7.38,7.597,6.077,36.903],
    [60,6.39,6.39,9.116,30.859],[63,5.377,5.168,9.364,24.831],[66,4.43,4.093,7.311,19.588],[69,3.561,3.165,3.283,15.106],[72,2.782,2.384,-2.397,11.356],
    [75,2.104,1.752,-6.542,8.328],[78,1.539,1.27,-7.096,6.019],[81,1.1,0.937,-5.423,4.429],[84,0.797,0.755,-2.891,3.559],[87,0.627,0.704,-0.915,3.312],
    [90,0.538,0.711,-0.126,3.339],[93,0.504,0.754,-0.014,3.533],[96,0.5,0.813,-0.039,3.806],[99,0.502,0.87,-0.034,4.07],[102,0.513,0.915,-0.029,4.282],
    [105,0.538,0.945,-0.023,4.424],[108,0.584,0.967,-0.015,4.534],[111,0.663,0.983,0.03,4.85],[114,0.816,0.994,0.19,5.353],[117,0.962,0.999,0.512,5.117],
    [119,1.0,1.0,0.689,4.798],
  ],
};
const slashes=[21,35,48,59,71,83,97,109];
function sample(rows,n) {
  let lo=0,hi=rows.length-1;
  while(lo+1<hi) {const middle=(lo+hi)>>1;if(rows[middle][0]<=n)lo=middle;else hi=middle}
  const a=rows[lo],b=rows[hi],blend=Math.max(0,Math.min(1,(n-a[0])/(b[0]-a[0])));
  return a.slice(1).map((v,i)=>v+(b[i+1]-v)*blend);
}
function puffBone(f) {
  const prefix=f.landedStart?'d04final':'d04finalair';
  return sample(tracks[prefix+({start:'startr',attack:'',end:'endr'}[f.finalPhase])],f.finalFrame);
}
function swordBone(f) {
  return sample(tracks[f.finalPhase==='attack'?'d04finalattack':'d04finalstart'],f.finalFrame);
}
const isActive=f=>f.action==='ultraSword' || f.action==='puffUp';
// Hue of Puff Up's silhouette, in unwrapped degrees sampled from #18086.
const auraHue=[[1,158],[9,194],[17,237],[25,274],[41,313],[57,411],[73,452],[89,496],
  [105,548],[121,608],[137,686],[145,706],[153,775],[169,814],[185,854],[201,900],
  [217,970],[233,1018],[241,1051],[249,1130],[265,1135],[281,1162],[297,1260],
  [313,1336],[329,1374],[345,1399],[361,1488],[377,1538],[393,1618],[409,1686],[425,1745],[454,1847]];
const puffHue=frame=>(sample(auraHue,frame)[0]%360)/360;
globalThis.SmashFinalSmash={slashes,bladeHit:tracks.bladeHit,puffBone,puffHue,swordBone,isActive};
})();
(() => {
  'use strict';
  const F=SmashFinalSmash, u=10/77.2737, tau=2*Math.PI;
  const clamp=(v,l=0,h=1)=>Math.max(l,Math.min(h,v));
  // In #18086 the visible Rot/HaveR pose is one sample behind the ACMD
  // counter during the eight cuts. Keep the game's counter on the caster.
  const swordPoseFrame=f=>f.finalPhase==='attack'?Math.max(0,f.finalFrame-1):f.finalFrame;
  F.swordPose=(f,caster,recorded=false)=>{
    if(f.action==='ultraSword' && (f.finalPhase==='attack' || recorded)) {
      const n=f.finalFrame;
      // Actor registration measured on the torso and the sword guard. The
      // Rot bone supplies the entire authored orbit, including camera depth.
      // The filmed Kirby is already offset when the neutral special begins.
      // A freely positioned caster enters the orbit from its own initial spot.
      const weight=(recorded?1:clamp(n/9))*clamp((196-n)/16);
      return {...f,x:f.x+1.11*weight*f.face,y:f.y+.44*weight,finalFrame:swordPoseFrame(f)};
    }
    if(f.action==='ultraSwordVictim' && caster?.action==='ultraSword') {
      const n=caster.finalFrame, combo=caster.finalPhase==='attack';
      const last=combo?F.slashes.findLast(at=>at<n):undefined;
      const close=caster.finalHits.includes('close');
      const caughtAt=close?17:54;
      const ease=combo?1:clamp((n-caughtAt)/8);
      const x=f.x+(caster.x+3.48*caster.face-f.x)*ease;
      const y=f.y+(caster.y+.55-f.y)*ease;
      const reacting=last!==undefined && last<109 && n<=109;
      // The receiver's open-eye spin follows Purin's original 30-frame
      // DamageFall. Two independent stretches give a full turn in 30 ticks.
      const spin=combo?(n>109?n-109:n+2):n-caughtAt-(close && caster.finalHits.includes('blade')?1:0);
      return {...f,x,y,action:reacting?'stun':'fall',grounded:false,tumbling:!reacting,
        face:-caster.face,actionFrame:1+(reacting?n-last:Math.max(0,spin)%30)};
    }
    return f;
  };
  const phaseWeight=(f)=>f.finalPhase==='end'?clamp((115-f.finalFrame)/30):1;
  // Local joint rotations from the matching four-segment cap article animation.
  const capTracks={start:'AAAOCTTocH0AAOQGGu6NfgAACeyTDpZ9AABx6TMVMnwAAD8L6fLUfgAAWBbEDGJ9AAD3D8f77X4AAHHpzeoyfAAALvNF3s56AAC0DNf3Gn8AAC0V3g5bfQAAKBN9Fbh8AABu6XfqI3wAAHvxx+pjfQAAGBW/6nJ8AABvFsMQ5XwAADHqO+8BfQAAi+lO7sN8AABO8ErtpX0AACYTg+q4fAAA/+ym9BF+AACI6eHts3wAAJ7pR/EpfQAAnuld8Sx9AAAG8C34wX4AAIbpju2mfAAAo+li8kp9AAC36fv2uH0AAOD7qwezfwAAcenN6jJ8AABx6c3qMnwAAMbpxf4MfgAATxalCpZ9AABg/V8NRX8AALrpJgjHfQAAcenN6jJ8AAA/EncJVn4AAFgWxAxifQAAaRbwDwJ9AAAQ9xEWw30AAI8G8fRZfwAA9hPkDMV9AAAtFvQPDH0AACAWPRVEfAAA6vsO5RB9AACAEk4LJn4AAPkUCRA+fQAA0xNvFZ98AABS74fhMXsAANcT7AJqfgAAMhUFEDV9AADnEZUV43wAACzpr+O4egAAcQhf+H1/AABpFvAPAn0AAI8WMxUyfAAAn+nH5617AADt9jXubn4AAE8WSA46fQAAixa+FEd8AABm6mbrd3wAAPjqqupxfAAArxTEA0J+AACPFjMVMnwAAB7uk+rrfAAAc+kW6z98AAC26an2sn0AAIoOXROvfQAApBZg6L57AAC+BDbthX4AAHHpzeoyfAAAsOkV9ZB9AABwBEzUOXgAAI4UTPKXfQAAOxZ0/QZ+AACU8rPwXn4AAMbpagANfgAAjRBT6g99AACPFs3qMnwAAI8WzeoyfAAAoAdh/8R/AACo6cQMYn0AAJfp8A8CfQAAcekzFTJ8AABWEDfVhncAAI8WzeoyfAAAaRbmDwN9AABY+y8W+X0AAOjvyutdfQAArw6k64N9AABZDNfqoX0AAHAQUeoSfQAAau0W/Zt+AADe+TfyG38AAB8HW+6TfgAAngUv78N+AADG6e0ADH4AANTq2fgIfgAA6gw68F1+AADPASH0bn8AAPvr1QBrfgAAxemK/Qd+AAAw9FzyuH4AAC8RyPVtfgAA3PIs/1F/AADF6Q4CCX4AALLpoPWcfQAAYQNH9pV/AACM9QsLF38AAM7rpvxZfgAAuunV98d9AAC07Lj2MX4AALHppQqWfQAAqOnEDGJ9AAAW7jgQsn0AAGvuZerufAAAzOzHChZ+AAAz6ssMen0AAKDp8Q8DfQAAM+pEFVJ8AAC39E4GV38AAKjpxAxifQAAl+nwDwJ9AACv6k8VZnw=',attack:'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'};
  // Broad reflected light travels from the tip to the hilt during the opening swing.
  // Each sample defines an ellipse in caster-relative world units and its screen-blend RGB.
  const openingBloom=[
    [28,-6.0155,6.3498,0.1335,0.2277,0.2028,0.5,0,0,0],
    [31,-6.0155,6.3498,0.1335,0.2277,0.2028,0.5,0.4546,0.6149,0.972],
    [35,-7.2057,7.4024,0.0401,0.0768,0.0591,1.5014,0.5844,0.6516,0.9603],
    [39,-3.0569,4.5758,0.0781,0.0493,0.0521,0.9328,0.5545,0.7152,0.992],
    [43,-1.8008,2.7356,0.0259,0.0266,0.0665,2.1598,0.3131,0.4447,0.676],
    [47,-0.9859,2.4825,0.0285,0.027,0.0737,2.3514,0.2631,0.3924,0.6512],
    [51,0.9944,1.2873,0.0578,0.0095,0.0564,1.545,0.1738,0.33,0.6579],
    [55,2.5864,-1.0502,0.0397,0.0177,0.023,2.5213,0.4329,0.4737,0.6847],
    [59,4.0,2.2832,0.014,-0.0178,0.062,1.72,0.4032,0.4264,0.5998],
    [63,0.5399,-2.0,0.0346,-0.003,0.0165,2.9817,0.3543,0.4076,0.6988],
    [67,0.566,-1.5523,0.0347,-0.0057,0.0194,3.1822,0.1827,0.2388,0.6457],
    [71,1.1592,1.2489,0.0507,0.0027,0.0493,2.2351,0.1195,0.1406,0.5447],
    [75,0.8322,0.6936,0.0457,-0.0069,0.0395,2.4589,0.0955,0.084,0.4781],
    [79,1.0346,1.1445,0.048,-0.0021,0.0444,2.2119,0.0535,0.0307,0.3799],
    [83,1.0567,1.2048,0.0485,0.001,0.049,1.5398,0.0127,0.0,0.2566],
    [87,1.0567,1.2048,0.0485,0.001,0.049,1.5398,0,0,0]
  ];
  // The finishing swing sends a second blue-white bloom across the scenery.
  const finishingBloom=[
    [271,-6.3222,6.0,0.0079,0.008,0.0352,4.0,0,0,0],
    [275,1.4918,4.7697,0.0555,0.1271,0.0853,0.558,0.7363,0.6459,1.0],
    [279,2.3842,2.0156,0.1053,0.0235,0.0065,0.5,0.4933,0.4141,0.648],
    [283,-2.9365,-0.2341,0.0233,-0.0185,0.0257,0.8559,0.6044,0.614,0.946],
    [287,-1.9861,-0.1754,0.0442,0.0108,0.035,0.5932,0.6736,0.7228,0.9883],
    [291,-2.9075,-0.6221,0.0352,-0.002,0.0214,0.8081,0.6389,0.6842,0.9948],
    [295,-2.035,1.7196,0.0458,0.0241,0.0312,0.6976,0.5817,0.633,0.9872],
    [299,-0.2235,0.7304,0.0477,-0.074,0.0467,4.0,0.0155,0.1311,0.2574],
    [303,-1.4487,-0.4586,0.0686,-0.09,0.037,4.0,0,0,0]
  ];
  F.createScene=(T,scene,models)=>{
    // Each column holds the distant sky's vertical colour profile at a motion
    // phase. The stage, fighters, contacts and UI render separately in front.
    function skyTexture(id) {
      const image=document.getElementById(id),texture=new T.Texture(image);
      texture.generateMipmaps=false;
      texture.minFilter=T.LinearFilter;
      if(image.complete && image.naturalWidth)texture.needsUpdate=true;
      else image.addEventListener('load',()=>{texture.needsUpdate=true;},{once:true});
      return texture;
    }
    const vortexMap=skyTexture('puff-vortex-map');
    vortexMap.wrapS=T.RepeatWrapping;
    const uniforms={mode:{value:0},time:{value:0},fade:{value:0},summon:{value:0},swordBackdrop:{value:-1},
      bandPalette:{value:skyTexture('sword-band-palette')},bandPhase:{value:0},vortexMap:{value:vortexMap},aspect:{value:16/9},
      goldShape:{value:new T.Vector4()},goldGain:{value:new T.Vector3()},goldFloor:{value:new T.Vector3()},goldPower:{value:0}};
    const stageSurface=new Set();
    scene.getObjectByName('Dream Land (64)').traverse(part=>{if(part.material?.color)stageSurface.add(part.material);});
    let lastDim=0;
    const plane=new T.Mesh(new T.PlaneGeometry(1,1),new T.ShaderMaterial({
      uniforms,transparent:true,depthWrite:false,
      vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`varying vec2 v;uniform float mode,time,fade,summon,swordBackdrop,goldPower;
        uniform vec4 goldShape;uniform vec3 goldGain,goldFloor;uniform sampler2D bandPalette,vortexMap;uniform float bandPhase,aspect;
        float noise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float sm(vec2 p){vec2 i=floor(p),a=fract(p);a=a*a*(3.-2.*a);return mix(mix(noise(i),noise(i+vec2(1,0)),a.x),mix(noise(i+vec2(0,1)),noise(i+1.),a.x),a.y);}
        void main(){vec2 p=(v-.5)*vec2(1.65,1.);float r=length(p),a=atan(p.y,p.x);
          float fog=sm(vec2(r*4.+a*.45-time*.28,a*2.3+time*.12))+sm(p*7.+time*.3)*.4;
          vec3 col=vec3(.012,.001,.025)+vec3(.24,.001,.185)*pow(clamp(fog*.94,0.,1.),3.);
          float opacity=.87;
          if(mode<.5){
            float bend=6.1*r+.53*sin(a*2.-time*.22)+time*.51;
            float cloud=sm(p*6.+vec2(time*.12,-time*.16));
            float arm=.5+.5*sin(a*3.+bend+.85*cloud);
            float ink=smoothstep(.29,.92,arm)*(.31+.69*cloud)*smoothstep(.11,.55,r);
            col=mix(vec3(.004,0.,.009),vec3(.285,.004,.146),ink);
            col+=vec3(.047,0.,.058)*ink*sm(p*15.+time*.11);
            vec2 offset=(v-.5)*1.05*vec2(aspect,-1.)*270.+vec2(43.80,-12.11);
            float theta=atan(offset.y,offset.x)-.261648*time;
            float logRadius=log(max(.1,length(offset)))-.283846*time;
            vec2 cloudUV=vec2(theta/6.2831853+.5/448.,1.-(logRadius+.1)/6.-.5/384.);
            vec4 gas=texture2D(vortexMap,cloudUV);
            col=mix(col,gas.rgb,gas.a);
            opacity=.995;
          }
          if(mode>1.5){float lane=sm(vec2(v.y*25.,.2));float layers=sm(vec2(v.y*79.,time*.55+v.x*1.2));float line=pow(layers,7.)+pow(sm(vec2(v.y*190.,time+v.x)),13.);
            float band=smoothstep(.13,.43,abs(v.y-.5));
            col=vec3(.012,.001,.018)+band*(vec3(.62,.015,.34)*lane+vec3(1.,.54,.83)*line*3.);
            opacity=.40+.49*band;}
          col=mix(col,vec3(1.,.77,.13)*exp(-r*r*3.5),summon);
          if(swordBackdrop>=0.){
            vec3 violet=mix(vec3(.053,0.,.154),vec3(.32,0.,.76),smoothstep(.56,1.,v.y));
            float height=clamp((v.y-.5)*1.05+.5,0.,1.);
            vec3 stripes=texture2D(bandPalette,vec2(bandPhase,height)).rgb;
            col=mix(violet,stripes,swordBackdrop);
            vec2 gold=(v-vec2(.59,.55))*vec2(3.8,2.12);
            col=mix(col,vec3(.38,.25,.012)*exp(-dot(gold,gold)*3.2),summon);
            opacity=1.;
          }
          if(goldPower>0.){
            vec2 shotUV=(v-.5)*1.05+.5;
            float radial=length((shotUV-goldShape.xy)/goldShape.zw);
            col=clamp(goldGain*exp(-pow(radial,goldPower))+goldFloor,0.,1.);
            opacity=goldPower>5.?1.:.68+.32*col.r;
            col=clamp((col-(1.-opacity)*vec3(.022,.081,.026))/opacity,0.,1.);
          }
          gl_FragColor=vec4(col,opacity*fade);}`
    }));
    plane.frustumCulled=false;plane.renderOrder=-2;scene.add(plane);
    const bloomUniforms={ellipse:{value:new T.Vector4()},tint:{value:new T.Vector3()}};
    const bladeBloom=new T.Mesh(new T.PlaneGeometry(42,42),new T.ShaderMaterial({
      uniforms:bloomUniforms,transparent:true,depthWrite:false,depthTest:true,
      blending:T.CustomBlending,blendSrc:T.OneFactor,blendDst:T.OneMinusSrcColorFactor,
      vertexShader:`varying vec2 offset;
        void main(){offset=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`varying vec2 offset;uniform vec4 ellipse;uniform vec3 tint;
        void main(){float x=offset.x,y=offset.y;
          float r=max(0.,ellipse.x*x*x+ellipse.y*x*y+ellipse.z*y*y);
          gl_FragColor=vec4(tint*exp(-pow(r,ellipse.w)),1.);}`
    }));
    bladeBloom.frustumCulled=false;bladeBloom.visible=false;bladeBloom.renderOrder=7;scene.add(bladeBloom);
    const sword=SmashNative.ultraSword(T),hat=SmashNative.ultraSwordHat(T),matrix=new T.Matrix4();
    // FinalStart attaches the charge star to Top. Even film frames resolve a
    // spinning five-point plane with a luminous ring just inside its edge.
    // [age, radius, tilt, spin, centre X/Y relative to Kirby's soles].
    const chargeStarKeys=[
      [1,0,6,220,0,.20],[6,.48,6,190,0,.20],[10,1.55,5.2,160,.16,.19],
      [16,2.04,5.7,107,.16,.23],[18,2.19,3.2,86,.16,.25],[22,2.63,-.6,44,.18,.28],
      [26,3.38,-1.2,15.4,.23,.28],[28,3.72,-.75,.9,.20,.27],[32,3.72,-.18,-26,.00,.25],
      [36,3.69,-.79,-46,.00,.20],[40,3.82,-.19,-62,.16,.24],[44,3.84,-.32,-77,.15,.29],
      [48,3.93,-.30,-91.6,.05,.22],[50,3.95,-.22,-97.7,.05,.22],[52,3.77,-.20,-102.2,.10,.23],
      [54,3.65,-.65,-108,.03,.25],[58,3.30,-.8,-115,.00,.21],[60,2.94,-1.4,-118,.05,.22],
      [62,2.6,1.7,-121,.00,.22],[63,0,4,-123,0,.22]
    ];
    const disk=new T.BufferGeometry(),directions=[0,0,0],levels=[0],indices=[];
    for(let i=0;i<10;i++) {
      const ang=i*Math.PI/5;
      directions.push(Math.cos(ang),i%2,Math.sin(ang));levels.push(1.13);
      indices.push(0,i+1,(i+1)%10+1);
    }
    disk.setAttribute('position',new T.Float32BufferAttribute(directions,3));
    disk.setAttribute('radial',new T.Float32BufferAttribute(levels,1));disk.setIndex(indices);
    const starLens={value:new T.Matrix4()},starView={value:new T.Vector2()};
    const starPose={value:new T.Vector4()},starWhite={value:0};
    const chargeStar=new T.Mesh(disk,new T.ShaderMaterial({
      side:T.DoubleSide,transparent:true,depthWrite:false,
      uniforms:{starLens,starView,starPose,starWhite},
      vertexShader:`uniform mat4 starLens;uniform vec2 starView;uniform vec4 starPose;
        attribute float radial;varying float ring;
        void main(){
          ring=radial;float s=sin(starPose.z),c=cos(starPose.z);
          vec2 dir=vec2(c*position.x-s*position.z,s*position.x+c*position.z);
          dir*=radial*starPose.x*mix(1.,.58,position.y);
          vec4 world=modelMatrix*vec4(starPose.w*dir.x,sin(starPose.y)*dir.y,cos(starPose.y)*dir.y,1.);
          gl_Position=projectionMatrix*viewMatrix*world;
          if(starView.x>0.){
            vec4 shot=starLens*world;
            gl_Position=vec4(shot.xy*starView,gl_Position.z/gl_Position.w*shot.w,shot.w);
          }
        }`,
      fragmentShader:`uniform float starWhite;varying float ring;
        void main(){
          float band=smoothstep(.46,.74,ring)*(1.-smoothstep(.77,.94,ring));
          float warmEdge=1.-.39*smoothstep(.55,.81,ring)+.12*smoothstep(.82,.92,ring);
          float blue=mix(mix(.40,.93,band),warmEdge,starWhite);
          blue=mix(blue,.60,smoothstep(.85,.96,ring));
          float alpha=1.-smoothstep(.90,1.085,ring);
          gl_FragColor=vec4(1.,.997,blue,alpha);
        }`
    }));
    chargeStar.name='Ultra Sword charge star';chargeStar.frustumCulled=false;chargeStar.visible=false;
    // The gold emitter keeps its colour under the blue mist from the weapon.
    chargeStar.renderOrder=8;scene.add(chargeStar);
    chargeStar.onBeforeRender=(_renderer,_scene,camera)=>{
      const lens=camera.userData.dreamLandLens;
      if(!lens){starView.value.set(0,0);return;}
      const m=lens.projection;
      starLens.value.set(...m.slice(0,8),0,0,0,0,...m.slice(8));
      starView.value.set(lens.width/(camera.right-camera.left),lens.width*9/(16*(camera.top-camera.bottom)));
    };
    sword.updateMatrixWorld(true);
    const swordSocket=sword.getObjectByName('Sword').matrixWorld.clone().invert();
    const bladeMaterials=[];
    sword.traverse(part=>{
      const mat=part.material;
      if(!mat?.isMeshStandardMaterial)return;
      mat.emissive.setHex(mat.name==='Hoshi'?0xcba216:0x375d78);
      mat.roughness=.37;mat.metalness=.04;
      if(mat.name!=='Hoshi') bladeMaterials.push(mat);
    });
    const capBones=[1,2,3,4].map(i=>hat.getObjectByName('S_Hat'+i)), capQuat=new T.Quaternion();
    const capClips=Object.fromEntries(Object.entries(capTracks).map(([key,base64])=>[key,new Int16Array(Uint8Array.from(atob(base64),v=>v.charCodeAt(0)).buffer)]));
    const swordAdjust=new T.Matrix4(),hatAdjust=new T.Matrix4();
    for(const accessory of [sword,hat]) {accessory.matrixAutoUpdate=false;accessory.visible=false;scene.add(accessory);}
    const signals=models.map(()=>({amount:{value:0},tint:{value:new T.Color(1,.33,.1)},skinPulse:{value:new T.Vector3()}}));
    models.forEach((model,i)=>{
      const signal=signals[i],seen=new Set();
      model.group.traverse(obj=>{
        const mat=obj.material;
        if(!mat || seen.has(mat) || (!mat.isMeshStandardMaterial && !mat.isMeshPhongMaterial))return;
        seen.add(mat);
        const compile=mat.onBeforeCompile.bind(mat),cache=mat.customProgramCacheKey?.bind(mat);
        const key=cache?.()||'';
        const puffMaterial=i===1, nativeEye=!!mat.userData.irisPattern;
        mat.customProgramCacheKey=()=>key+'|final-rim|'+puffMaterial+'|'+nativeEye;
        mat.onBeforeCompile=shader=>{
          compile(shader);shader.uniforms.fsMix=signal.amount;shader.uniforms.fsTint=signal.tint;shader.uniforms.fsSkinPulse=signal.skinPulse;
          // Puff Up shows the native gold iris and sclera as luminous pigment.
          // A saturation-based highlight would brighten its yellow perimeter
          // while leaving the white core and the sclera under scene lighting.
          const finish=puffMaterial
            ? nativeEye
              ? 'vec3 eyeLight=diffuseColor.rgb*(1.08+.36*(1.-iris.a))+vec3(.025,.02,.008)*iris.a; outgoingLight=mix(outgoingLight,eyeLight,fsMix);'
              : `float angle=1.-abs(normalize(normal).z);
                float puffRim=pow(angle,2.85);
                float lightSkin=smoothstep(.045,.21,diffuseColor.g);
                float fillWeight=.36+.64*smoothstep(.008,.065,diffuseColor.g);
                vec3 puffLight=outgoingLight*vec3(.43,.39,.44)+fillWeight*vec3(.158,.134,.138);
                puffLight+=lightSkin*(fsSkinPulse+pow(angle,1.50)*(.095+fsTint*.27)+puffRim*(fsTint*1.24+vec3(.18)));
                outgoingLight=mix(outgoingLight,puffLight,fsMix);`
            : `float fRim=pow(1.-abs(dot(normalize(normal),normalize(vViewPosition))),2.1);
               outgoingLight=mix(outgoingLight,outgoingLight*vec3(.53,.49,.57)+fsTint*(fRim*1.9+.035)+vec3(1.)*pow(fRim,3.)*.6,fsMix);`;
          shader.fragmentShader='uniform float fsMix;uniform vec3 fsTint,fsSkinPulse;\n'+shader.fragmentShader
            .replace('#include <opaque_fragment>',finish+'\n#include <opaque_fragment>');
        };
        mat.needsUpdate=true;
      });
    });
    return {update(f,view,lens){
      const recordedFinal=lens?.final, frame=f?.actionFrame??lens?.frame, grade=lens?.grade??1;
      const skyGrade=recordedFinal?SmashStage.finalSkyRecovery(recordedFinal,frame):null;
      scene.userData.finalSkyGrade=skyGrade;
      plane.visible=!!f || (skyGrade?.[0]??0)*grade>0;
      sword.visible=hat.visible=bladeBloom.visible=chargeStar.visible=false;
      signals.forEach(s=>{s.amount.value=0;});
      const dim=f?clamp(f.actionFrame/4)*(f.action==='puffUp'?phaseWeight(f):f.finalPhase==='attack'?clamp((221-f.finalFrame)/20):1):0;
      const recordedSword=recordedFinal==='ultra-sword';
      // Matched on the same leaf and wood details before, during, and after
      // the late exposure recovery in both recorded Final Smashes.
      const stageFade=recordedFinal
        ? Math.pow(1-clamp((frame-(recordedSword?299:429))/(recordedSword?23:29)),recordedSword?1.55:1.7)*grade
        : 0;
      scene.userData.finalStageFade=stageFade;
      const materialDim=recordedFinal?0:dim;
      if(materialDim!==lastDim) {
        for(const mat of stageSurface)mat.color.setScalar(1-.84*materialDim);
        lastDim=materialDim;
      }
      if(!plane.visible)return;
      const w=view.right-view.left,h=view.top-view.bottom, puff=f?f.action==='puffUp':recordedFinal==='puff-up',n=f?.finalFrame;
      // The recorded effect replaces the distant sky behind Whispy and the planks.
      const gold=recordedSword && SmashStage.swordOpeningLight[frame-1];
      if(gold){
        uniforms.goldShape.value.fromArray(gold,0);uniforms.goldPower.value=gold[4];
        uniforms.goldGain.value.fromArray(gold,5);uniforms.goldFloor.value.fromArray(gold,8);
      } else uniforms.goldPower.value=0;
      const summonScreen=!!gold;
      plane.position.set((view.right+view.left)/2,(view.top+view.bottom)/2,recordedFinal && !summonScreen?-14:-.66);plane.scale.set(w*1.05,h*1.05,1);
      uniforms.mode.value=puff?0:f?.finalPhase==='start'?1:2;uniforms.time.value=frame/60;
      uniforms.aspect.value=w/h;
      uniforms.swordBackdrop.value=recordedSword?clamp((frame-92)/12):-1;
      uniforms.bandPhase.value=(.5+clamp((frame-92)/2,0,104))/105;
      uniforms.summon.value=!puff && f?.finalPhase==='start' && (n>0 || recordedSword)?clamp((13-n)/7):0;
      const aura=f?clamp(frame/8)*(puff?phaseWeight(f):f.finalPhase==='attack'?clamp((221-n)/30):1):0;
      // The real sky emerges sooner than the stage surface and keeps a tint
      // through the last recorded frame in both sequences.
      uniforms.fade.value=skyGrade?skyGrade[0]*grade:aura;
      if(!f)return;
      const s=signals[f.index];s.amount.value=aura;
      s.tint.value.setHSL(puff?F.puffHue(f.actionFrame):(f.actionFrame*.012+.15)%1,.91,.57);
      if(puff){
        // The body pulses every eleven action frames. Its shaded fill follows
        // the rotating rim colour while the self-lit golden irises stay steady.
        const pulse=[0,0,0,.08,.41,.74,1,1,1,.98,.69][(f.actionFrame+2)%11];
        const h=F.puffHue(f.actionFrame)*tau,c=Math.cos(h),v=Math.sin(h);
        s.skinPulse.value.set(
          -.098+.024*c+.015*v+pulse*(.170-.025*c-.019*v),
          -.018-.023*c+.035*v+pulse*(.086-.005*c-.021*v),
          -.063-.008*c-.028*v+pulse*(.140-.012*c-.006*v)
        ).multiplyScalar(clamp((f.actionFrame-148)/34)*clamp((431-f.actionFrame)/40));
        return;
      }
      const body=models[f.index];const hand=body.getBoneMatrixWorld?.('HaveR',matrix);
      const last=f.finalPhase==='attack'?clamp((n-114)/49)*(1-clamp((n-183)/18)):0;
      // Both articles spawn on ACMD F1. In the filmed startup the hat is
      // already visible, the blade tip clears it on F4, and the short sword
      // holds its size before growing to full reach around F33.
      const age=f.actionFrame;
      const bloom=f.finalPhase==='attack' && age>270?finishingBloom:openingBloom;
      if(age>bloom[0][0] && age<bloom[bloom.length-1][0]){
        const i=bloom.findIndex(row=>row[0]>=age),a=bloom[i-1],b=bloom[i];
        const mix=(age-a[0])/(b[0]-a[0]),v=j=>a[j]+(b[j]-a[j])*mix;
        // The ambient light falls on the scenery behind the fighters and the gold guard.
        bladeBloom.position.set(f.x+f.face*v(1),f.y+v(2),-.7);
        bloomUniforms.ellipse.value.set(v(3),f.face*v(4),v(5),v(6));
        bloomUniforms.tint.value.set(v(7),v(8),v(9));bladeBloom.visible=true;
      }
      if(f.finalPhase==='start' && age>1 && age<63) {
        const key=chargeStarKeys.findIndex(row=>row[0]>=age);
        const a=chargeStarKeys[key-1],b=chargeStarKeys[key],t=(age-a[0])/(b[0]-a[0]);
        const [r,pitch,spin,x,y]=a.slice(1).map((v,i)=>v+(b[i+1]-v)*t);
        const origin=body.group.position;
        chargeStar.position.set(origin.x+x*f.face,origin.y+y,origin.z);
        starPose.value.set(r,pitch*Math.PI/180,spin*Math.PI/180,f.face);
        starWhite.value=1-clamp((age-39)/10);chargeStar.visible=true;
      }
      const bladeScale=f.finalPhase==='start'?.32*clamp((age-3)/5)+.68*clamp((age-24)/9):1;
      for(const mat of bladeMaterials)mat.emissive.setRGB(.062+last*.38,.12+last*.44,.20+last*.52);
      if(hand) {
        const size=bladeScale*(1+last*.72);
        swordAdjust.makeScale(size,size,size);sword.matrix.copy(hand).multiply(swordAdjust);
      }
      else {
        const [x,y,tx,ty]=F.swordBone(f),dx=(tx-x)*f.face,dy=ty-y;
        const size=u*bladeScale;
        sword.matrix.makeRotationZ(-Math.atan2(dx,dy)).scale(new T.Vector3(size,size*Math.hypot(dx,dy)/43,size));
        sword.matrix.setPosition(f.x+x*u*f.face,f.y+y*u,.3);
      }
      // The article's rigid mesh vertices are in Sword-local space. Its own
      // initial Have orientation must not rotate them a second time at HaveR.
      sword.matrix.multiply(swordSocket);
      sword.matrixWorldNeedsUpdate=true;sword.visible=bladeScale>0;
      const head=body.getBoneMatrixWorld?.('Head',matrix);
      if(head) {
        const cap=capClips[f.finalPhase],frame=Math.min(swordPoseFrame(f)/3,cap.length/16-1),first=Math.floor(frame),second=Math.ceil(frame);
        capBones.forEach((bone,i)=>{
          const p=first*16+i*4,q=second*16+i*4;
          bone.quaternion.set(cap[p]/32767,cap[p+1]/32767,cap[p+2]/32767,cap[p+3]/32767).normalize();
          capQuat.set(cap[q]/32767,cap[q+1]/32767,cap[q+2]/32767,cap[q+3]/32767).normalize();
          bone.quaternion.slerp(capQuat,frame-first);
        });
        // The cap article is authored Y-up. The head joint's local X points
        // up in the bind pose, so remove its bind rotation before attaching.
        hatAdjust.set(0,1,0,-6.3704, 0,0,1,0, 1,0,0,0, 0,0,0,1);
        hat.matrix.copy(head).multiply(hatAdjust);hat.matrixWorldNeedsUpdate=true;hat.visible=true;
      }
    }};
  };
  function star(ctx,x,y,size,spin,color){
    ctx.save();ctx.translate(x,y);ctx.rotate(spin);ctx.fillStyle=color;ctx.beginPath();
    for(let k=0;k<10;k++){const a=Math.PI/2+k*Math.PI/5,r=size*(k%2?.45:1);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}
    ctx.closePath();ctx.fill();ctx.restore();
  }
  // The filmed portrait enters at F4, holds through the screen shake, then
  // clears the right edge. Rows are pixel transforms in its 640×360 reference.
  const startPortrait=[
    [448,170,0.511,0],[373.63,170.777,0.503,-0.006],[343.921,169.355,0.501,-0.0],[339.77,164.669,0.494,-0.002],
    [328.204,161.974,0.501,0.001],[330.303,182.44,0.502,-0.003],[340.218,173.695,0.502,-0.01],[309.486,169.829,0.501,-0.001],
    [326.129,193.052,0.502,-0.018],[328.739,150.253,0.502,-0.005],[326.305,174.077,0.499,-0.002],[342.498,174.488,0.484,0.002],
    [330.811,166.478,0.499,-0.002],[330.355,187.332,0.499,-0.003],[338.926,169.503,0.5,-0.0],[314.25,167.354,0.503,0.005],
    [330.301,177.322,0.498,-0.004],[331.085,163.323,0.5,0.001],[326.861,178.415,0.5,0.002],[338.747,169.162,0.501,0.0],
    [323.596,166.655,0.498,0.002],[321.857,173.06,0.499,-0.002],[339.405,167.942,0.509,0.0],[321.121,164.424,0.502,-0.001],
    [321.593,172.027,0.502,0.001],[410.114,167.638,0.501,0.004],[515,172,0.51,0],[570,172,0.51,0],
    [624,172,0.51,0],
  ];
  // Window x, portrait x/y in a 640 × 360 viewport. The face shakes inside
  // the stationary panel between the two slides.
  const puffPortrait=[
    [470.85,455.03,6.95],[396.15,389.24,6.95],[361.5,358.23,6.91],[349.05,351.05,-.31],[342.05,342.08,-.23],
    [337.6,345.1,20],[337.6,356.3,7.6],[337.6,323.8,7.6],[337.6,344.3,24.1],
    [337.6,344.2,-12.9],[337.6,340.3,10.8],[337.6,348.3,10.6],[337.6,344.4,3.4],
    [337.6,344.3,24.1],[337.6,352.4,7.7],[337.6,327.9,7.4],[337.6,344.3,13.6],
    [337.6,344.2,1.4],[337.6,340.3,17.8],[337.6,352.3,7.6],[337.6,336.1,5.6],
    [337.6,336.1,9.7],[337.6,356.5,7.6],[337.6,336.2,2.4],[337.6,336.1,10.6],
    [408,423.2,7.3],[489,485.3,-.1],[565,575.3,-5.4],[620,625,8]
  ];
  // Isolated native discharge paths from #18086 at 60 Hz. Each vertex stores
  // reference X/Y, half-width in thirds of a pixel, and local power in tenths.
  const swordArcs={
    281:[[73,177,16,0,73,183,16,0,73,192,7,8,73,200,12,10,71,208,18,10,69,219,22,10,63,228,24,10,59,238,24,10,57,246,16,10,58,252,16,10]],
    282:[[62,175,11,3,65,180,6,8,72,189,11,10,87,195,14,10,96,209,14,10,100,217,12,10,104,225,16,10,102,237,18,10,91,250,24,10,85,256,22,2,81,261,24,9]],
    283:[[45,152,5,1,48,157,6,7,57,170,10,9,66,175,7,8,76,179,12,9,84,193,15,10,86,202,14,9],
         [79,217,6,0,78,227,3,0,73,233,18,7,74,238,20,9,71,246,12,10,63,256,10,8]],
    284:[[26,146,4,0,30,153,7,8,40,159,6,2],
         [53,166,18,2,57,171,9,8,62,178,12,10,64,184,14,10,63,194,14,4],
         [53,225,23,0,51,231,17,6,49,235,21,8,47,240,11,8,36,253,4,2]],
    289:[[53,207,4,1,49,222,9,8,43,230,11,8,41,236,22,9,39,247,24,10,32,258,24,5],
         [63,222,4,0,61,235,14,8,58,240,20,9,46,249,24,10,34,258,24,10]],
    290:[[49,201,11,1,45,214,8,8,38,225,11,8,33,234,24,9,32,240,23,9,31,246,9,2,31,253,24,10],
         [62,212,11,1,60,219,3,1,57,228,10,7,51,236,24,10,39,243,24,10,27,253,24,10]],
    291:[[84,138,10,4,83,144,20,2,81,151,7,9,80,159,10,9,73,174,9,9,69,182,10,9,65,189,11,9,58,193,8,9,49,198,6,8,39,203,11,10,29,211,15,9,24,220,20,10,18,229,23,10,15,240,24,10,12,251,24,10]],
    292:[[91,85,24,0,88,94,7,7,87,98,8,8,83,111,15,10,82,122,17,10,82,134,23,10,87,144,20,10,84,153,12,9,81,165,13,10,77,173,13,9,70,181,14,9,60,188,21,10,48,195,24,10,42,202,24,10,36,208,24,10,30,214,24,9,22,221,24,10,16,231,24,10,11,241,24,10],
         [71,179,14,10,61,192,24,10,56,200,24,10,52,208,24,9,41,220,24,10,31,225,24,9,27,230,24,9]],
    293:[[89,81,14,2,85,86,6,6,76,97,11,10,62,101,14,10,55,107,15,10,46,119,14,10,38,132,11,10,32,145,16,10,33,157,15,10,36,173,24,10,36,185,24,10,35,194,24,10,33,203,24,10,31,211,24,10,30,221,24,9,25,230,24,10,18,240,24,10,16,253,24,8],
         [103,143,20,1,104,148,12,4,101,153,19,2,99,159,7,7,97,164,8,9,89,177,10,9,80,191,10,9,75,195,10,9,62,201,11,7,60,207,15,7,57,215,10,9,51,223,17,7,42,222,23,6,35,237,24,9,29,238,24,9,22,246,24,10]],
    294:[[93,73,23,1,88,78,7,6,83,84,7,9,75,92,12,10,62,95,14,10,53,104,14,10,46,115,14,10,39,127,12,10,33,139,15,10,33,151,16,10,35,161,20,10,36,172,24,10,36,184,24,10,34,193,24,10,32,201,24,10,33,214,23,9,31,223,24,8,26,230,24,9,20,239,24,9],
         [119,105,21,1,116,110,9,5,113,116,7,8,108,130,15,10,104,144,21,10,105,156,21,10,102,165,12,9,95,179,12,10,86,189,10,9,72,198,22,10,62,208,24,6,61,212,23,2,56,218,2,1,51,226,1,1,43,230,23,3,34,243,24,9,25,243,24,8]],
    295:[[85,77,7,8,75,90,9,9,59,95,11,9,50,105,12,10,45,113,15,10,40,120,14,10,38,137,8,5],
         [123,98,20,0,119,105,6,6,108,115,9,10,99,118,11,10,91,121,14,10,81,130,13,10,72,141,10,10,66,148,11,9,61,155,13,10,59,160,14,10,59,173,15,10,61,188,24,10,60,203,24,9,58,207,24,5,53,214,24,10,48,222,24,10,46,232,24,8,41,234,24,5,39,236,24,5,38,242,24,3,39,250,24,2],
         [40,167,3,2,37,184,11,10,40,192,12,9,41,200,23,10,46,216,24,9,45,220,24,7,42,222,24,5,38,237,24,2]],
    296:[[89,78,8,5,81,83,8,9,75,87,13,2],
         [60,94,17,2,56,99,10,8,46,112,14,10,43,127,3,2],
         [126,96,13,2,121,102,6,8,114,108,8,9,107,115,8,9,92,118,10,9,84,125,10,9,78,132,13,10,71,141,11,10,68,152,8,5,67,158,16,1],
         [46,168,13,1,42,176,7,8,44,188,8,8,48,202,24,8,57,210,24,8,59,221,24,8,55,226,24,6,52,236,24,5,52,243,15,3,42,242,2,0,41,243,1,0],
         [63,183,5,5,59,198,21,10,61,204,24,9,66,212,24,9,63,218,24,9,65,226,24,10,64,229,24,9,57,233,24,6,53,240,24,6]],
    297:[[127,99,22,0,121,104,8,8,111,109,12,3],
         [98,114,20,1,93,118,11,8,82,128,15,10,78,138,12,8,76,144,19,2],
         [70,180,21,0,67,187,9,8,65,198,9,9,66,209,14,9,67,216,10,9,72,220,6,3,77,227,7,6,74,235,4,5],
         [104,192,10,8,104,197,8,8,102,198,6,8,99,199,6,6,94,207,9,3,91,205,6,1,86,199,3,2,81,198,4,6,74,201,5,4,69,204,16,6,66,208,14,8]],
    299:[[68,204,10,9,60,213,8,9,52,222,6,9,44,231,6,8,35,242,6,9],
         [37,235,5,2,34,242,6,9,30,246,7,8,24,252,14,6,26,258,9,7]],
    300:[[68,214,1,0,61,218,1,0,62,225,2,1,57,230,8,8,49,239,23,10,47,249,24,10],
         [42,232,2,0,48,236,17,6,48,244,23,10]],
    301:[[104,172,13,1,99,178,6,2,91,185,7,9,85,195,7,9,78,207,7,10,79,220,8,8,80,222,10,8,80,231,21,9,79,234,20,8,78,235,15,5,72,233,6,2,69,234,4,3,66,237,6,6,63,245,22,9]],
    302:[[129,147,17,0,126,154,9,7,120,161,13,10,106,171,19,10,94,173,18,10,89,179,12,9,82,186,13,10,77,201,11,10,74,212,23,10,70,220,24,9,67,231,24,10],
         [93,209,1,0,89,208,2,0,86,209,10,1,81,209,20,6,80,215,24,10,76,224,24,10]],
    303:[[131,137,13,0,129,140,18,0,132,145,10,3,130,151,7,8,129,161,11,10,132,171,13,10,128,186,12,10,122,200,10,10],
         [80,191,1,0,73,198,1,0,73,204,2,1,64,211,7,9,59,219,9,9,59,220,9,9,53,225,8,8,48,233,23,9,44,243,23,10,41,252,24,9],
         [103,201,24,6,105,210,24,8,95,213,24,9,85,216,24,10,75,226,24,9,65,233,24,10]],
    304:[[140,141,12,1,136,144,7,6,133,156,9,9,137,172,11,9,132,186,10,10,127,195,10,8,117,196,15,5],
         [104,212,19,6,101,214,10,2,97,213,5,4,90,218,7,9,76,221,10,9,68,221,19,9,59,217,24,9,61,217,24,9,54,222,18,9,45,229,16,10,40,243,10,8,38,251,21,10,37,257,23,10]],
    305:[[142,140,15,0,138,144,11,4,137,146,7,7,138,154,6,4],
         [136,164,17,0,139,169,17,3,139,176,8,9,136,183,11,9,132,189,23,9,128,194,24,10,114,201,24,9,106,200,24,7,105,208,24,7,104,211,22,5,95,206,12,0],
         [102,201,22,3,103,205,15,3,95,206,4,1,95,211,6,5,91,214,7,7,75,218,7,7,68,215,5,7],
         [14,198,21,0,16,203,7,5,19,215,7,9,21,224,23,9,22,231,24,9,29,235,24,9,35,236,24,8,31,244,24,3,21,244,24,7],
         [65,202,2,0,62,209,9,7,54,217,7,7,46,227,8,8,42,239,14,9]],
    306:[[-1,177,22,10,4,187,11,10,13,194,9,9,23,201,11,10,23,202,13,10,32,216,22,10,34,227,23,10,26,236,24,10,18,249,24,10,17,254,24,10],
         [106,196,11,7,96,195,5,4,84,205,3,3,78,212,4,7,73,222,5,7,71,228,10,9,64,235,20,10],
         [129,200,17,7,127,200,15,5,121,197,13,2,119,198,17,3,119,202,23,7,116,204,24,7,108,199,21,5,107,200,21,5,107,209,22,7,100,218,7,5,93,217,4,5,90,218,5,8]],
    307:[[-5,179,24,4,0,182,24,9,13,192,24,10,21,205,24,10,30,217,24,10,32,225,22,10,33,227,23,10,31,238,17,9,28,244,20,7,18,241,24,6,16,257,24,10],
         [79,210,6,2,76,219,24,9,64,232,24,10],
         [105,203,20,5,106,210,8,2,102,211,2,0,101,217,3,0,94,217,2,0,91,222,10,1,85,221,23,7,77,219,24,9,71,226,24,10,63,233,20,10]],
    308:[[-4,102,24,1,1,104,21,1,7,107,10,5,15,118,11,10,26,124,13,9,31,133,14,10,35,142,11,10,38,150,11,10,39,161,16,10,35,167,14,10,27,180,24,10,22,191,24,10,21,204,24,10,17,212,19,10,14,219,14,10,10,230,24,10,13,243,19,10,17,257,13,10],
         [113,193,9,3,109,197,11,7,105,198,15,7,102,199,10,3,104,205,2,0,99,208,3,2,98,211,3,0,101,217,10,4,96,220,13,7,93,227,13,8]],
    309:[[-6,86,2,0,2,88,5,1,11,100,8,8,19,114,9,8,34,120,12,9,37,128,14,10,42,138,17,10,40,151,7,6],
         [32,170,6,0,29,176,7,7,27,186,14,10,20,194,23,9,16,201,22,10,6,205,24,10,1,216,24,10,2,235,20,9,6,243,14,9,15,249,17,10,18,258,9,9],
         [113,195,22,6,106,197,12,6,101,196,10,5,102,195,10,4,96,198,5,4,94,206,6,9,94,216,8,7,93,227,14,9]],
  };
  const boltTiles=new Map();
  function drawSwordArcs(ctx,f,frame){
    const branches=swordArcs[frame];
    if(!branches)return;
    let tile=boltTiles.get(frame);
    if(!tile){
      // Rasterize only the tapered polylines. Width and intensity come from
      // cross-sections, with no pixels from the stage, blade or players.
      let x0=640,y0=360,x1=0,y1=0;
      for(const path of branches)for(let i=0;i<path.length;i+=4){
        const pad=path[i+2]*1.4+2;
        x0=Math.min(x0,path[i]-pad);x1=Math.max(x1,path[i]+pad);
        y0=Math.min(y0,path[i+1]-pad);y1=Math.max(y1,path[i+1]+pad);
      }
      x0=Math.floor(x0);y0=Math.floor(y0);
      const canvas=document.createElement('canvas');
      canvas.width=Math.ceil(x1)-x0+1;canvas.height=Math.ceil(y1)-y0+1;
      const paint=canvas.getContext('2d'),map=paint.createImageData(canvas.width,canvas.height);
      for(const path of branches)for(let i=4;i<path.length;i+=4){
        const x=path[i-4]-x0,y=path[i-3]-y0,dx=path[i]-x0-x,dy=path[i+1]-y0-y;
        const pad=Math.max(path[i-2],path[i+2])*1.4+2,den=dx*dx+dy*dy||1;
        const endX=Math.min(canvas.width-1,Math.ceil(Math.max(x,x+dx)+pad));
        const endY=Math.min(canvas.height-1,Math.ceil(Math.max(y,y+dy)+pad));
        for(let py=Math.max(0,Math.floor(Math.min(y,y+dy)-pad));py<=endY;py++){
          for(let px=Math.max(0,Math.floor(Math.min(x,x+dx)-pad));px<=endX;px++){
            const t=clamp(((px-x)*dx+(py-y)*dy)/den);
            const radius=(path[i-2]+(path[i+2]-path[i-2])*t)/3+.25;
            const power=(path[i-1]+(path[i+3]-path[i-1])*t)/10;
            const q=((px-x-t*dx)**2+(py-y-t*dy)**2)/(radius*radius);
            const core=Math.exp(-1.0*q),edge=Math.exp(-.52*q),glow=Math.exp(-.095*q);
            const alpha=255*power*Math.min(1,.79*edge+.28*glow);
            const k=(py*canvas.width+px)*4;
            if(alpha<map.data[k+3] || alpha<1)continue;
            map.data[k]=81+174*core;map.data[k+1]=215+40*core;map.data[k+2]=255;map.data[k+3]=alpha;
          }
        }
      }
      paint.putImageData(map,0,0);tile={canvas,x0,y0};boltTiles.set(frame,tile);
    }
    const lens=SmashStage.finalReplayCamera('ultra-sword',frame),pixel=lens.width/640;
    ctx.save();ctx.globalAlpha=1;
    ctx.translate(f.x+f.face*(lens.x+1),f.y-SmashSim.platforms[3].y+lens.y);
    ctx.scale(f.face*pixel,-pixel);ctx.drawImage(tile.canvas,tile.x0-320,tile.y0-180);
    ctx.restore();
  }
  let cutins, swordStrokes, finishSweep;
  function swordLight(ctx,f,sourceFrame,image,tile,columns,cellW,cellH,dx=0,dy=0) {
    if(!image.complete || !image.naturalWidth)return;
    const lens=SmashStage.finalReplayCamera('ultra-sword',sourceFrame);
    const width=lens.width,height=width*9/16;
    const x=f.x+f.face*(lens.x+1)+dx;
    const top=f.y-SmashSim.platforms[3].y+lens.y+height/2+dy;
    ctx.save();ctx.globalAlpha=1;
    ctx.translate(x,top);ctx.scale(f.face,-1);
    ctx.drawImage(image,(tile%columns)*cellW,Math.floor(tile/columns)*cellH,
      cellW,cellH,-width/2,0,width,height);
    ctx.restore();
  }
  F.draw=(ctx,m,f,view)=>{
    if(!f)return;
    f=SmashPuffFX.visualPose(f);
    const n=f.finalFrame,phase=f.finalPhase,age=f.actionFrame,puff=f.action==='puffUp',face=f.face;
    ctx.save();
    if(puff) {
      const [sx,sy,,height]=F.puffBone(f);
      SmashPuffFX.drawFinalSmoke(ctx,f,sx);
      if(age>30 && phase==='start') {
        const centerY=f.y+height*u;
        for(let j=0;j<6;j++){
          const drift=(age/35+j*.317)%1, ang=j*2.399+age*.014, r=.036+.087*Math.sin(drift*Math.PI);
          const x=f.x+Math.cos(ang)*(.9+sx*.78)*(1+drift*.10), y=centerY+Math.sin(ang)*(.7+sy*.54);
          const radius=r*(1+sx*.18);ctx.save();ctx.globalAlpha=.82*Math.sin(drift*Math.PI);
          const glow=ctx.createRadialGradient(x,y,0,x,y,radius*2.8);
          glow.addColorStop(0,'white');glow.addColorStop(.24,'#ffeaff');glow.addColorStop(.50,'rgba(255,164,244,.8)');glow.addColorStop(1,'rgba(240,85,232,0)');
          ctx.fillStyle=glow;ctx.fillRect(x-radius*2.8,y-radius*2.8,radius*5.6,radius*5.6);ctx.restore();
        }
      }
    } else {
      const anchorX=f.x+face*34*u,anchorY=f.y+1.05;
      // Real-time game frames continue through the two-frame pause on each
      // confirmed combo hit. Use phase time so that a late opening catch can
      // still enter the same eight independently photographed sword sweeps.
      let sourceFrame=age,cell=-1,dx=0,dy=0;
      if(phase==='start' && age>=5 && age<=73) {
        cell=age-5;
        const victim=m.fighters[f.finalTarget];
        if(age>=17 && age<=27) {
          if(victim) {
            const blend=clamp((n-17)/62);
            // The photographed target starts 3.39 stage units in front of Kirby.
            // Translate the contact flash by the live target's displacement from that pose.
            dx=victim.x-f.x-face*(3.39+(34*u-3.39)*blend);
            dy=victim.y-f.y-.25*blend;
          } else cell=age===17?11:206+age-18;
        } else if(age>=54 && age<=70 && !victim) {
          // A missed sword swing still has the weapon trail, without a hit flash.
          cell=189+age-54;
        }
      } else if(phase==='attack' && n>=F.slashes[0] && n<126) {
        const earlier=F.slashes.filter(at=>at<n).length;
        const pause=F.slashes.includes(n)?2-f.finalPause:0;
        sourceFrame=82+n+2*earlier+pause;
        if(sourceFrame<=222)cell=69+sourceFrame-103;
      }
      if(cell>=0) {
        swordStrokes ||= document.querySelectorAll('#sword-combo-plates img');
        swordLight(ctx,f,sourceFrame,swordStrokes[Math.floor(cell/72)],cell%72,8,448,252,dx,dy);
      }
      const charge=phase==='start' || n<205;
      if(charge && !(phase==='start' && age>=5 && age<=37))for(let j=0;j<12;j++){
        const t=(age*.018+j/12)%1,a=j*2.4+age*.027;
        const cx=phase==='start'?f.x:anchorX;
        ctx.globalAlpha=.8*Math.sin(t*Math.PI);
        star(ctx,cx+Math.cos(a)*(1.2+3.4*t),anchorY+Math.sin(a)*(.9+2*t),.06+.17*t,a,j%3?'#fff496':'#d0f9ff');
      }
      // The visible finishing sweep starts one frame after the damage command.
      // Each tile is a transparent matte of the rainbow and shockwave, sampled
      // at 60 Hz from 119.000s in the same Dream Land match as the camera.
      if(phase==='attack')drawSwordArcs(ctx,f,n+98);
      const tile=n-174;
      if(phase==='attack' && tile>=0 && tile<35) {
        finishSweep ||= document.getElementById('sword-finish-sweep');
        swordLight(ctx,f,272+tile,finishSweep,tile,6,512,288);
      }
    }
    ctx.globalAlpha=1;
    cutins ||= document.querySelectorAll('#final-cutins img');
    const portrait=cutins[f.index];
    if(portrait.complete && portrait.naturalWidth) {
      const w=view.right-view.left,h=view.top-view.bottom;
      if(!puff && age>=4 && age<=32) {
        const [px,py,cs,sn]=startPortrait[age-4];
        const pixel=h/360, left=(view.right+view.left)/2-320*pixel;
        ctx.save();ctx.translate(left+px*pixel,view.top-py*pixel);ctx.scale(pixel,-pixel);
        ctx.transform(cs,sn,-sn,cs,0,0);ctx.drawImage(portrait,0,0);ctx.restore();
      } else if(puff && age>=4 && age<=32) {
        const [panel,px,py]=puffPortrait[age-4],pixel=Math.min(w/640,h/360);
        ctx.save();ctx.translate(view.right-640*pixel,view.top);ctx.scale(pixel,-pixel);
        ctx.beginPath();ctx.moveTo(panel+84,0);ctx.lineTo(panel,21.4);
        ctx.lineTo(panel+57,111.6);ctx.lineTo(panel+342,90.5);ctx.lineTo(panel+342,0);
        ctx.closePath();ctx.clip();
        ctx.translate(px,py);ctx.scale(.5215,.5215);ctx.drawImage(portrait,-42,-65);
        ctx.restore();
      }
    }
    ctx.restore();
  };
})();
