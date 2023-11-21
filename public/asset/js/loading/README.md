Loading
===
```
Create : 2023-11-19
Author : Yugeta.Koji
```

# Summary
- 大きいデータをサーバーから読み込む時に表示するプログレスバー。


# Howto
- 使用するJSでimport
```
import { Loading } from "./asset/js/loading/loading.js"
```

- 開始（階層はjsの場所によって相対パスに変更する）
```
Loading.set_status('active')
```

- 途中(progress-rate: 1 ~ 100)
```
Loading.set_rate(progress-rate)
```

- jsでprogress終了
```
Loading.set_status('passive')
```

