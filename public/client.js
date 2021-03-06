$(document).ready(function()
      {
        var playerName = null;
        var progressTimer = null;

        var questionTemplate =  '<div class="sixteen wide column center"><strong>QUESTION <%= number %></strong></div>' +
                    '<div class="sixteen wide column center"><h2><%= text %></h2></div>' +
                    '<% _.each(props, function(p, i){ %>' +
                      '<div class="eight wide column center p1"><button data-id="<%= i %>" class="answer ui button"><%= p %></button></div>' +
                    '<% }); %>';
          questionTmpl = _.template(questionTemplate);

        var modalTemplate =   '<div class="header">Header</div>' +
                        '<div class="content">' +
                        '<p>Your Score : <span class="score"><%= you.score %> pts</span></p>' +
                        '<% if(winner.username.toLowerCase() === you.name.toLowerCase()) { %>' +
                          '<p>YOU WIN !!!</p>' +
                        '<% } else { %>' +
                          '<p><%= winner %> WIN !!!</p>' +
                        '<% } %>' +
                      '</div>' +
                    '</div>';

          modalTmpl = _.template(modalTemplate);

        var socket = io.connect();
          socket.on('ePlayerList', function(data)
          {
            var eListHasChanged = $.Event("listHasChanged");
              eListHasChanged.scores = data.scores;

            $('#player-list').trigger(eListHasChanged);
          });
          socket.on('eNewQuestion', function(q)
          {
            var eResetProgress = $.Event("reset");
              eResetProgress.time = 20;
              eResetProgress.label = "Time remaining";
              eResetProgress.empty = false;

            $('.progress').trigger(eResetProgress);

            $('button.answer').off('click');

            var content = questionTmpl(q);
            $('#question').html(content);

            $('button.answer').on('click', function()
            {
              $(this).addClass('blue');
              $(this).prop('disabled', true);

              socket.emit('eAnswer', $(this).data('id'));
            });
          });
          socket.on('eCorrection', function(data)
          {
            var eListHasChanged = $.Event("listHasChanged");
              eListHasChanged.scores = data.scores;

            $('#player-list').trigger(eListHasChanged);

            var eCorrection = $.Event("correction");
              eCorrection.values = data.correctAnswers;

            $('#question').trigger(eCorrection);
          });
          socket.on('eGameFinished', function(data)
          {
            $("#modalGameOver").html(modalTmpl({ you : { name : playerName, score : data.scores[playerName] }, winner : data.winner }));
            $("#modalGameOver").modal("show");
          });
          socket.on('eGameStart', function()
          {
            var eResetProgress = $.Event("reset");
              eResetProgress.time = 15;
              eResetProgress.label = "A New Game will start in 15 seconds";
              eResetProgress.empty = true;

            $('.progress').trigger(eResetProgress);
          });
          socket.on('eWelcome', function(data)
          {
            $('button#btnUsername').on('click', function(e)
            {
              playerName = $('#modalUsername').find('input[name=username]').val();
              if(playerName.length > 0)
              {
                socket.emit('eLogin', playerName);

                $('#modalUsername').modal({ closable : false });
                $('#modalUsername').modal('hide');

                var eResetProgress = $.Event("reset");
                eResetProgress.time = 20;
                eResetProgress.label = null;

                $('.progress').trigger(eResetProgress);
              }
            });
            $('#modalUsername').modal('show');            
          });
        $('form').on('submit', function(e){ e.preventDefault(); });
        $('#player-list').on('listHasChanged', function(e)
        {
          $('#player-list').empty();
          $.each(e.scores, function(i, user)
          {
            $('#player-list').append('<li>' + user.username + ' <span class="score right bold">' + user.score + "</span></li>")
          });
        });
        $('#question').on('correction', function(e)
        {
          $('#question').find('button.answer').prop('disabled', true);

          var eResetProgress = $.Event("reset");
            eResetProgress.time = 5;
            eResetProgress.label = "Waiting for next question";
            eResetProgress.empty = false;

            $('.progress').trigger(eResetProgress);

          $('#question').find('button.answer').each(function(i)
          {
            if($(this).hasClass('blue'))
            {
              if(e.values.indexOf(i) > -1)
              {
                $(this).addClass('green');
              }
              else
              {
                $(this).addClass('red');
              }
            }
          });
        });
        $('.ui.progress').on('reset', function(e)
        {
          clearInterval(progressTimer);

          $('.ui.progress').progress({ 'value' : e.time * 2, 'total' : e.time * 2, label: 'ratio', showActivity : false, autoSuccess : false, precision : 1, text : ''});
          $('.ui.progress').find('.label').html(e.label);

          if(e.empty)
          {
            $('#question').empty();
          }

          progressTimer = setInterval(function()
          {
            $('.ui.progress').progress('decrement');
          }, 500);
        });
      });   