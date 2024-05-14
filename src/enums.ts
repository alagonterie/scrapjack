export type NavigateOptions = 'HOME' | 'PLAY' | 'WATCH' | 'CREATE'

export type ModalTypeOptions = 'OKAY' | 'KICK' | 'BAN'

export type JustifyOptions = 'left' | 'right' | 'center'

export type ColorOptions = 'blue' | 'green' | 'red'

export type TeamIdOptions = 'team1' | 'team2'

export type TurnTypeOptions = 'tap' | 'scrap' | 'jack'

export type HostMoveUserOptions = 'host' | 'spec' | 'team1' | 'team2' | 'swap' | 'kick' | 'ban'

export type CallableOptions =
  'games-edit' | 'games-join' | 'games-ready' | 'games-start' | 'games-turn' | 'games-leave' |
  'lobbies-sendMessage' | 'lobbies-enter' | 'lobbies-leave' | 'lobbies-create' | 'lobbies-moveUser' |
  'presence-disconnect' |
  'profiles-updateDisplayname'
